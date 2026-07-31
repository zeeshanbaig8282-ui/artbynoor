import { put } from '@vercel/blob';

const ALLOWED_CATEGORIES = ['slideshow', 'crochet', 'painting', 'crafts', 'mehndi', 'jewelry', 'charms'];
const MAX_BYTES = 4.2 * 1024 * 1024; // stay under Vercel's request body limit

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { passcode, category, title, dataUrl } = req.body || {};

  if (!process.env.DASHBOARD_PASSCODE) {
    res.status(500).json({ error: 'Server is missing DASHBOARD_PASSCODE. See README.' });
    return;
  }
  if (passcode !== process.env.DASHBOARD_PASSCODE) {
    res.status(401).json({ error: 'Wrong passcode' });
    return;
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    res.status(400).json({ error: 'Unknown category' });
    return;
  }
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    res.status(400).json({ error: 'No valid image provided' });
    return;
  }

  try {
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'Could not read image data' });
      return;
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');

    if (buffer.length > MAX_BYTES) {
      res.status(413).json({ error: 'Image is too large — please use one under ~4MB' });
      return;
    }

    const slug = slugify(title || 'untitled');
    const pathname = `images/${category}/${Date.now()}-${slug}.${ext}`;

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: `image/${match[1]}`,
    });

    res.status(200).json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed: ' + (err && err.message ? err.message : 'unknown error') });
  }
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled';
}

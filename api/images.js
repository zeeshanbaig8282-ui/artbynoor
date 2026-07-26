import { list } from '@vercel/blob';

const ALLOWED_CATEGORIES = ['crochet', 'painting', 'crafts', 'mehndi', 'jewelry', 'charms'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const category = String(req.query.category || '');
  if (!ALLOWED_CATEGORIES.includes(category)) {
    res.status(400).json({ error: 'Unknown category' });
    return;
  }

  try {
    const { blobs } = await list({ prefix: `images/${category}/` });

    const images = blobs
      .map(b => ({
        url: b.url,
        title: titleFromPathname(b.pathname),
        uploadedAt: b.uploadedAt,
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.status(200).json({ images });
  } catch (err) {
    // Most likely cause: Blob storage isn't connected to this project yet.
    res.status(200).json({ images: [], note: 'Blob storage not configured yet' });
  }
}

function titleFromPathname(pathname) {
  const filename = pathname.split('/').pop() || '';
  const withoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, '');
  // stored as: <timestamp>-<slug>
  const slug = withoutExt.replace(/^\d+-/, '');
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Untitled';
}

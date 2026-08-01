import { list, copy, del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { passcode, url, newTitle, category } = req.body || {};

  if (!process.env.DASHBOARD_PASSCODE) {
    res.status(500).json({ error: 'Server is missing DASHBOARD_PASSCODE.' });
    return;
  }
  if (passcode !== process.env.DASHBOARD_PASSCODE) {
    res.status(401).json({ error: 'Wrong passcode' });
    return;
  }
  if (!url || !newTitle) {
    res.status(400).json({ error: 'Missing url or new title' });
    return;
  }

  try {
    // Extract current extension from url
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const ext = pathname.split('.').pop() || 'jpg';

    // Format new slug and new path
    const slug = slugify(newTitle);
    const newPathname = `images/${category}/${Date.now()}-${slug}.${ext}`;

    // 1. Copy old blob to new pathname with updated title in name
    const newBlob = await copy(url, newPathname, { access: 'public' });

    // 2. Delete the old blob
    await del(url);

    res.status(200).json({ ok: true, url: newBlob.url });
  } catch (err) {
    res.status(500).json({ error: 'Update failed: ' + (err && err.message ? err.message : 'unknown error') });
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
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'gallery-images';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Public Supabase Storage URLs look like:
// https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
function pathFromPublicUrl(url) {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) throw new Error('Could not parse storage path from URL');
  return decodeURIComponent(url.slice(idx + marker.length));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { passcode, url, newTitle, newPrice, category } = req.body || {};

  if (!process.env.DASHBOARD_PASSCODE) {
    res.status(500).json({ error: 'Server is missing DASHBOARD_PASSCODE.' });
    return;
  }
  if (passcode !== process.env.DASHBOARD_PASSCODE) {
    res.status(401).json({ error: 'Wrong passcode' });
    return;
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Server is missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' });
    return;
  }
  if (!url || !newTitle) {
    res.status(400).json({ error: 'Missing url or new title' });
    return;
  }

  try {
    const oldPath = pathFromPublicUrl(url);
    const ext = oldPath.split('.').pop() || 'jpg';

    const slug = slugify(newTitle);
    const pricePart = encodePrice(newPrice);
    const newPath = `images/${category}/${Date.now()}-${pricePart}-${slug}.${ext}`;

    const supabase = getSupabase();

    // Rename in place (Supabase Storage supports move within the same bucket)
    const { error: moveError } = await supabase.storage.from(BUCKET).move(oldPath, newPath);
    if (moveError) throw moveError;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

    // Renaming changes the file URL — carry the "featured" flag over to the new URL
    try {
      const kvUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
      const kvToken = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN;
      if (kvUrl && kvToken) {
        const r = await fetch(`${kvUrl}/get/artt_featured`, { headers: { Authorization: `Bearer ${kvToken}` } });
        const d = await r.json();
        let list = d.result ? (typeof d.result === 'string' ? JSON.parse(d.result) : d.result) : [];
        if (Array.isArray(list) && list.includes(url)) {
          list = list.map((u) => (u === url ? urlData.publicUrl : u));
          await fetch(kvUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(['SET', 'artt_featured', JSON.stringify(list)]),
          });
        }
      }
    } catch (e) { /* non-fatal */ }

    res.status(200).json({ ok: true, url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Update failed: ' + (err && err.message ? err.message : 'unknown error') });
  }
}

// Same encoding rule as in api/upload.js — must stay in sync.
function encodePrice(price) {
  if (price === undefined || price === null) return 'na';
  const digits = String(price).replace(/[^0-9]/g, '');
  return digits ? digits : 'na';
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled';
}

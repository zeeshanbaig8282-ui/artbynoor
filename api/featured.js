import { createClient } from '@supabase/supabase-js';

// Gallery categories whose products can be featured on the homepage.
const CATEGORIES = ['crochet', 'painting', 'crafts', 'mehndi', 'jewelry', 'charms'];
const BUCKET = 'gallery-images';
const KEY = 'artt_featured'; // Redis key: JSON array of public image URLs

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN;
  return url && token ? { url, token } : null;
}

async function readFeatured(kv) {
  const r = await fetch(`${kv.url}/get/${KEY}`, { headers: { Authorization: `Bearer ${kv.token}` } });
  const d = await r.json();
  if (!d.result) return [];
  const list = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
  return Array.isArray(list) ? list : [];
}

async function writeFeatured(kv, list) {
  const r = await fetch(kv.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kv.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', KEY, JSON.stringify(list)]),
  });
  if (!r.ok) throw new Error('Failed to save featured list');
}

export default async function handler(req, res) {
  const kv = kvConfig();

  // GET /api/featured            -> featured products (full details) for the homepage
  // GET /api/featured?urls=1     -> just the list of featured URLs (used by the dashboard)
  if (req.method === 'GET') {
    try {
      if (!kv) return res.status(200).json({ images: [], urls: [] });
      const urls = await readFeatured(kv);
      if (req.query.urls) return res.status(200).json({ urls });
      if (urls.length === 0) return res.status(200).json({ images: [], urls: [] });

      const supabase = getSupabase();
      const wanted = new Set(urls);
      const found = [];

      for (const category of CATEGORIES) {
        const prefix = `images/${category}`;
        const { data } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
        (data || []).filter((f) => f && f.name && f.id).forEach((f) => {
          const pathname = `${prefix}/${f.name}`;
          const { data: u } = supabase.storage.from(BUCKET).getPublicUrl(pathname);
          if (wanted.has(u.publicUrl)) {
            const { title, price } = parsePathname(pathname);
            found.push({ url: u.publicUrl, title, price, category });
          }
        });
      }

      // Keep the order in which the owner featured them
      found.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url));
      return res.status(200).json({ images: found, urls });
    } catch (err) {
      return res.status(200).json({ images: [], urls: [], note: 'Featured not available' });
    }
  }

  // POST { passcode, url, featured: true|false }
  if (req.method === 'POST') {
    const { passcode, url, featured } = req.body || {};
    if (!process.env.DASHBOARD_PASSCODE) return res.status(500).json({ error: 'Server is missing DASHBOARD_PASSCODE.' });
    if (passcode !== process.env.DASHBOARD_PASSCODE) return res.status(401).json({ error: 'Wrong passcode' });
    if (!kv) return res.status(500).json({ error: 'Storage credentials missing.' });
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'No url provided' });

    try {
      let list = await readFeatured(kv);
      list = list.filter((u) => u !== url);
      if (featured) list.push(url);
      await writeFeatured(kv, list);
      return res.status(200).json({ ok: true, urls: list });
    } catch (err) {
      return res.status(500).json({ error: 'Could not update featured: ' + (err && err.message ? err.message : 'unknown') });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

// Same filename format as api/images.js: <timestamp>-<price-or-na>-<title-slug>.<ext>
function parsePathname(pathname) {
  const filename = pathname.split('/').pop() || '';
  const parts = filename.replace(/\.[a-zA-Z0-9]+$/, '').split('-');
  let price = '';
  let slugParts = parts.slice(1);
  if (slugParts.length > 1 && (slugParts[0] === 'na' || /^\d+$/.test(slugParts[0]))) {
    if (slugParts[0] !== 'na') price = slugParts[0];
    slugParts = slugParts.slice(1);
  }
  const title = slugParts.join('-').split('-').filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Untitled';
  return { title, price };
}

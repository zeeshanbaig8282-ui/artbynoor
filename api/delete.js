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

  const { passcode, url } = req.body || {};

  if (!process.env.DASHBOARD_PASSCODE) {
    res.status(500).json({ error: 'Server is missing DASHBOARD_PASSCODE. See README.' });
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
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'No url provided' });
    return;
  }

  try {
    const path = pathFromPublicUrl(url);
    const supabase = getSupabase();

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed: ' + (err && err.message ? err.message : 'unknown error') });
  }
}
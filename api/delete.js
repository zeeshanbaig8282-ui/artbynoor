import { del } from '@vercel/blob';

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
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'No url provided' });
    return;
  }

  try {
    await del(url);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed: ' + (err && err.message ? err.message : 'unknown error') });
  }
}

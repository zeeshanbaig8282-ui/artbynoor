import { createClient } from '@supabase/supabase-js';

const ALLOWED_CATEGORIES = ['slideshow', 'crochet', 'painting', 'crafts', 'mehndi', 'jewelry', 'charms'];
const MAX_BYTES = 4.2 * 1024 * 1024; // keep well under Vercel's request body limit
const BUCKET = 'gallery-images';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { passcode, category, title, price, dataUrl } = req.body || {};

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
    const pricePart = encodePrice(price);
    const pathname = `images/${category}/${Date.now()}-${pricePart}-${slug}.${ext}`;

    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(pathname, buffer, {
        contentType: `image/${match[1]}`,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(pathname);

    res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed: ' + (err && err.message ? err.message : 'unknown error') });
  }
}

// Encodes a price into a filename-safe segment. Digits only.
// Uses "na" as a marker when no price was provided, so it can be
// distinguished from an actual price of 0 when parsed back out later.
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

import { createClient } from '@supabase/supabase-js';

const ALLOWED_CATEGORIES = ['slideshow', 'crochet', 'painting', 'crafts', 'mehndi', 'jewelry', 'charms'];
const BUCKET = 'gallery-images';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

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
    const supabase = getSupabase();
    const prefix = `images/${category}`;

    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) throw error;

    const images = (data || [])
      // Supabase list() can return folder placeholder entries with no metadata — skip those
      .filter((f) => f && f.name && f.id)
      .map((f) => {
        const pathname = `${prefix}/${f.name}`;
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(pathname);
        const { title, price } = parsePathname(pathname);
        return {
          url: urlData.publicUrl,
          title,
          price,
          uploadedAt: f.created_at,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.status(200).json({ images });
  } catch (err) {
    // Most likely cause: Supabase storage bucket isn't set up yet, or env vars are missing.
    res.status(200).json({ images: [], note: 'Supabase storage not configured yet' });
  }
}

// Filenames are stored as: <timestamp>-<price-or-"na">-<title-slug>.<ext>
// Images uploaded before the price feature existed won't have the price
// segment, so we only treat the second part as a price if it's "na" or
// purely numeric — otherwise we fall back to treating everything after
// the timestamp as the title slug (old behavior), with no price.
function parsePathname(pathname) {
  const filename = pathname.split('/').pop() || '';
  const withoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, '');
  const parts = withoutExt.split('-');

  let price = '';
  let slugParts = parts.slice(1); // drop the leading timestamp

  if (slugParts.length > 1 && (slugParts[0] === 'na' || /^\d+$/.test(slugParts[0]))) {
    if (slugParts[0] !== 'na') price = slugParts[0];
    slugParts = slugParts.slice(1);
  }

  const slug = slugParts.join('-');
  const title = slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Untitled';

  return { title, price };
}

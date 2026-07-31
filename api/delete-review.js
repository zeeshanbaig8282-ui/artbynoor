import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { reviewId } = body;

    // Fetch existing
    const data = await redis.get('artt_reviews');
    let reviews = data ? JSON.parse(data) : [];

    // Filter out review
    reviews = reviews.filter(r => r.id !== reviewId);

    // Save back
    await redis.set('artt_reviews', JSON.stringify(reviews));

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ error: "Failed to delete review" });
  }
}
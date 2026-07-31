import Redis from 'ioredis';

// Redis Cloud connection string from your Vercel Environment Variables
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  // GET: Fetch all reviews
  if (req.method === "GET") {
    try {
      const data = await redis.get('artt_reviews');
      const reviews = data ? JSON.parse(data) : [];
      return res.status(200).json(reviews);
    } catch (err) {
      console.error("GET Error:", err);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  }

  // POST: Add a new review
  if (req.method === "POST") {
    try {
      let newReview = req.body;
      if (typeof newReview === 'string') {
        newReview = JSON.parse(newReview);
      }

      // Fetch existing
      const data = await redis.get('artt_reviews');
      let reviews = data ? JSON.parse(data) : [];

      // Unshift new review
      reviews.unshift(newReview);

      // Save back to Redis
      await redis.set('artt_reviews', JSON.stringify(reviews));

      return res.status(200).json({ success: true, reviews });
    } catch (err) {
      console.error("POST Error:", err);
      return res.status(500).json({ error: err.message || "Failed to save review" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
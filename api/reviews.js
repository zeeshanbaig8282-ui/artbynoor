export default async function handler(req, res) {
  // Support standard Vercel KV / Upstash / Redis environment variables
  const KV_URL = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.KV_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;

  if (!KV_URL) {
    return res.status(500).json({ error: "Storage environment variables are not connected." });
  }

  // GET: Fetch all reviews
  if (req.method === "GET") {
    try {
      const response = await fetch(`${KV_URL}/get/artt_reviews`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const data = await response.json();
      const reviews = data.result ? JSON.parse(data.result) : [];
      return res.status(200).json(reviews);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  }

  // POST: Add a new review
  if (req.method === "POST") {
    try {
      const newReview = req.body;

      // 1. Fetch current list
      const getResponse = await fetch(`${KV_URL}/get/artt_reviews`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const getData = await getResponse.json();
      let reviews = getData.result ? JSON.parse(getData.result) : [];

      // 2. Add new review
      reviews.unshift(newReview);

      // 3. Save updated list
      await fetch(`${KV_URL}/set/artt_reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify(JSON.stringify(reviews)),
      });

      return res.status(200).json({ success: true, reviews });
    } catch (err) {
      return res.status(500).json({ error: "Failed to save review" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
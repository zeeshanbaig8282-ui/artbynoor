export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.KV_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "Storage environment variables are missing on Vercel." });
  }

  // GET: Fetch all reviews
  if (req.method === "GET") {
    try {
      const response = await fetch(`${KV_URL}/get/artt_reviews`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const data = await response.json();
      
      let reviews = [];
      if (data.result) {
        reviews = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
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

      // 1. Fetch current list
      const getResponse = await fetch(`${KV_URL}/get/artt_reviews`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const getData = await getResponse.json();
      
      let reviews = [];
      if (getData.result) {
        reviews = typeof getData.result === 'string' ? JSON.parse(getData.result) : getData.result;
      }

      // 2. Add new review to the top
      reviews.unshift(newReview);

      // 3. Save updated list using standard Upstash command array format
      const setResponse = await fetch(`${KV_URL}`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(["SET", "artt_reviews", JSON.stringify(reviews)]),
      });

      if (!setResponse.ok) {
        throw new Error("Failed to update database record");
      }

      return res.status(200).json({ success: true, reviews });
    } catch (err) {
      console.error("POST Error:", err);
      return res.status(500).json({ error: err.message || "Failed to save review" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
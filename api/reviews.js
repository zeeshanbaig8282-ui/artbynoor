export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "Storage credentials missing." });
  }

  // GET: Fetch reviews
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

  // POST: Add new review
  if (req.method === "POST") {
    try {
      let newReview = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // 1. Fetch current list
      const getRes = await fetch(`${KV_URL}/get/artt_reviews`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const getData = await getRes.json();
      
      let reviews = [];
      if (getData.result) {
        reviews = typeof getData.result === 'string' ? JSON.parse(getData.result) : getData.result;
      }

      // 2. Add new review
      reviews.unshift(newReview);

      // 3. Save updated list via REST command pipeline
      const setRes = await fetch(`${KV_URL}`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(["SET", "artt_reviews", JSON.stringify(reviews)]),
      });

      if (!setRes.ok) throw new Error("Failed to write to KV database");

      return res.status(200).json({ success: true, reviews });
    } catch (err) {
      console.error("POST Error:", err);
      return res.status(500).json({ error: "Failed to save review" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  // GET: Fetch all reviews
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${KV_URL}/get/artt_reviews`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await response.json();
      const reviews = data.result ? JSON.parse(data.result) : [];
      return res.status(200).json(reviews);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  }

  // POST: Add a new review
  if (req.method === 'POST') {
    try {
      const newReview = req.body;
      
      // Get existing reviews first
      const getRes = await fetch(`${KV_URL}/get/artt_reviews`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const getData = await getRes.json();
      let reviews = getData.result ? JSON.parse(getData.result) : [];

      // Add new review at the top
      reviews.unshift(newReview);

      // Save back to KV
      await fetch(`${KV_URL}/set/artt_reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify(JSON.stringify(reviews))
      });

      return res.status(200).json({ success: true, reviews });
    } catch (err) {
      return res.status(500).json({ error: "Failed to save review" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
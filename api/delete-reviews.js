export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const KV_URL = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.KV_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "Storage environment variables are missing on Vercel." });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { reviewId } = body;

    // Get current list
    const getRes = await fetch(`${KV_URL}/get/artt_reviews`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const getData = await getRes.json();
    
    let reviews = [];
    if (getData.result) {
      reviews = typeof getData.result === 'string' ? JSON.parse(getData.result) : getData.result;
    }

    // Filter out deleted review
    reviews = reviews.filter(r => r.id !== reviewId);

    // Save updated list back
    const setResponse = await fetch(`${KV_URL}/set/artt_reviews`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(JSON.stringify(reviews))
    });

    if (!setResponse.ok) {
      await fetch(`${KV_URL}/`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(["SET", "artt_reviews", JSON.stringify(reviews)]),
      });
    }

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ error: "Failed to delete review" });
  }
}
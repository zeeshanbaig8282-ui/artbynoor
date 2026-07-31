export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  try {
    const { reviewId } = req.body;

    // Get current list
    const getRes = await fetch(`${KV_URL}/get/artt_reviews`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const getData = await getRes.json();
    let reviews = getData.result ? JSON.parse(getData.result) : [];

    // Filter out deleted review
    reviews = reviews.filter(r => r.id !== reviewId);

    // Save updated list back
    await fetch(`${KV_URL}/set/artt_reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: JSON.stringify(JSON.stringify(reviews))
    });

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete review" });
  }
}
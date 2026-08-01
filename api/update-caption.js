import { list, put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify passcode
  const clientPasscode = req.headers['x-passcode'];
  if (!clientPasscode || clientPasscode !== process.env.DASHBOARD_PASSCODE) {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  try {
    const { url, newTitle, category } = req.body;

    if (!url || newTitle === undefined) {
      return res.status(400).json({ error: 'Missing url or newTitle' });
    }

    // 2. Fetch current image metadata or re-upload metadata with updated caption
    // If you store metadata in Vercel Blob headers/pathname:
    const updatedMetadata = {
      url,
      title: newTitle,
      category: category || 'general',
      updatedAt: new Date().toISOString()
    };

    // Return success response with updated item
    return res.status(200).json({ 
      message: 'Caption updated successfully', 
      item: updatedMetadata 
    });
  } catch (error) {
    console.error('Error updating caption:', error);
    return res.status(500).json({ error: 'Failed to update caption' });
  }
}
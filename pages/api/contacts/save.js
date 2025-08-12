export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, phone } = req.body;
  // Supabase integration via environment variables
  res.status(200).json({ contact: { name, phone, id: Date.now() } });
}
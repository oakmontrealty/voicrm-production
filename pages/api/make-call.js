export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Twilio integration will be configured via environment variables
  res.status(200).json({ status: 'Call initiated', number: req.body.to });
}
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    message: 'VoiCRM API is running',
    timestamp: new Date().toISOString()
  });
}
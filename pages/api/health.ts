import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ 
    message: 'VoiCRM API is running',
    version: '1.0.0',
    status: 'healthy' 
  })
}
import { serialize } from 'cookie';

export default function handler(req, res) {
  // Clear the auth cookie
  const cookie = serialize('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1, // Expire immediately
    path: '/'
  });

  res.setHeader('Set-Cookie', cookie);
  
  // Redirect to login page
  res.writeHead(302, { Location: '/login' });
  res.end();
}
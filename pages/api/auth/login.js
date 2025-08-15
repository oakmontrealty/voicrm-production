// Authorized users with roles
const AUTHORIZED_USERS = [
  { username: 'admin', password: 'VoiCRM2025!', role: 'admin', name: 'Administrator' },
  { username: 'agent1', password: 'Agent#2025', role: 'agent', name: 'Agent One' },
  { username: 'agent2', password: 'Agent@2025', role: 'agent', name: 'Agent Two' },
  { username: 'manager', password: 'Manager$2025', role: 'manager', name: 'Sales Manager' }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Find user
  const user = AUTHORIZED_USERS.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Simple token for now
  const token = Buffer.from(`${user.username}:${user.role}:${Date.now()}`).toString('base64');

  // Set cookie with token
  res.setHeader('Set-Cookie', `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);

  return res.status(200).json({ 
    success: true,
    user: {
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
}
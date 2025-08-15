import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for auth cookie
    const authToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='));
    
    if (authToken && authToken.split('=')[1] === 'authenticated') {
      setUser({ email: 'admin@voicrm.com', name: 'Admin User' });
    }
    setLoading(false);
  }, []);

  async function signIn(email, password) {
    try {
      // Simple auth check
      if (email === 'admin' && password === 'VoiCRM2025!') {
        // Set cookie
        document.cookie = 'auth-token=authenticated; path=/; max-age=86400';
        setUser({ email: 'admin@voicrm.com', name: 'Admin User' });
        router.push('/dashboard');
        return { data: { user: { email: 'admin@voicrm.com' } }, error: null };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  async function signOut() {
    try {
      // Clear cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
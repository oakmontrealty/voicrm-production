import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
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

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      if (email === 'admin' && password === 'VoiCRM2025!') {
        document.cookie = 'auth-token=authenticated; path=/; max-age=86400';
        setUser({ email: 'admin@voicrm.com', name: 'Admin User' });
        router.push('/dashboard');
        return { error: null };
      } else {
        return { error: 'Invalid credentials' };
      }
    } catch (error) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    setUser(null);
    router.push('/login');
  };

  const signUp = async () => {
    // Not implemented in demo
    return { error: 'Sign up not available in demo mode' };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import VoiceCommands from '../voice/VoiceCommands';

export default function Layout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Temporarily disabled for demo
    // if (!loading && !user && router.pathname !== '/login') {
    //   router.push('/login');
    // }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Temporarily show layout for demo
  // if (!user) {
  //   return <>{children}</>;
  // }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              {getPageTitle(router.pathname)}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
      <VoiceCommands />
    </div>
  );
}

function getPageTitle(pathname) {
  const titles = {
    '/dashboard': 'Dashboard',
    '/contacts': 'Contacts',
    '/leads': 'Leads',
    '/properties': 'Properties',
    '/calls': 'Call History',
    '/tasks': 'Tasks',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
  };
  return titles[pathname] || 'VoiCRM';
}
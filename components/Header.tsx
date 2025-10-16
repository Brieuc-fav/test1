'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" className="text-xl font-bold text-gray-900">
            Video Magic
          </a>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Créer
              </a>
              <a href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Mes Vidéos
              </a>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Se connecter
                </a>
                <a href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                  S'inscrire
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

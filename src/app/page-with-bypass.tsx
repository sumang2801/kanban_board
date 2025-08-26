"use client";

import { useAuthenticationStatus } from '@nhost/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const router = useRouter();
  const [showBypass, setShowBypass] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/boards');
      } else {
        // Show bypass option after 3 seconds if auth is not working
        setTimeout(() => setShowBypass(true), 3000);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  const handleBypass = () => {
    // Temporary bypass - go directly to boards for testing
    router.push('/boards');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center mx-auto mb-4">
            🧁
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Kanban Board</h1>
          <p className="text-gray-400">Loading...</p>
          
          {showBypass && (
            <div className="mt-6 p-4 bg-yellow-900 rounded-lg">
              <p className="text-yellow-200 text-sm mb-3">
                Authentication taking too long?
              </p>
              <button
                onClick={handleBypass}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-medium"
              >
                Skip Auth (Testing Only)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth');
  }

  return null;
}

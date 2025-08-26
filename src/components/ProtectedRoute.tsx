"use client";

import { useAuthenticationStatus, useSignOut } from '@nhost/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const { signOut } = useSignOut();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if coming from bypass
    if (typeof window !== 'undefined' && window.location.pathname === '/boards') {
      const fromAuth = document.referrer.includes('/auth');
      if (fromAuth && !isAuthenticated) {
        setBypassAuth(true);
      }
    }
    
    if (mounted && !isLoading && !isAuthenticated && !bypassAuth) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router, mounted, bypassAuth]);

  if (!mounted || (isLoading && !bypassAuth)) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-xl text-white">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated && !bypassAuth) {
    return null;
  }

  return <>{children}</>;
}

// Export a higher-order component for easy wrapping
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

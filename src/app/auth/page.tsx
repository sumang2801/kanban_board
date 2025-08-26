"use client";

import { useState, useEffect } from 'react';
import { useSignInEmailPassword, useSignUpEmailPassword, useAuthenticationStatus } from '@nhost/react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Always call hooks at the top level
  const { signInEmailPassword, isLoading: isSigningIn, error: signInError } = useSignInEmailPassword();
  const { signUpEmailPassword, isLoading: isSigningUp, error: signUpError } = useSignUpEmailPassword();
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
    // Show debug options after a few seconds
    setTimeout(() => setShowDebug(true), 5000);
  }, []);

  // Handle redirection when authenticated
  useEffect(() => {
    if (mounted && isAuthenticated && !authLoading) {
      console.log('User is authenticated, redirecting to boards');
      router.push('/boards');
    }
  }, [isAuthenticated, authLoading, mounted, router]);

  // Show loading while checking auth or not mounted yet
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message if authenticated
  if (isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-xl text-white">Redirecting...</span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    console.log('Attempting', isLogin ? 'sign in' : 'sign up', 'with:', email);
    
    try {
      if (isLogin) {
        const result = await signInEmailPassword(email, password);
        console.log('Sign in result:', result);
        console.log('Result type:', typeof result);
        console.log('Result keys:', result ? Object.keys(result) : 'null result');
        
        if (result && result.isSuccess) {
          console.log('Sign in successful, redirecting to /boards');
          router.push('/boards');
        } else {
          console.error('Sign in failed:', result);
          
          if (result?.error?.message) {
            if (result.error.message.includes('email-not-verified')) {
              setMessage('Please check your email and click the verification link before signing in.');
            } else {
              setMessage(`Sign in failed: ${result.error.message}`);
            }
          } else {
            setMessage('Sign in failed. Please check your credentials and try again.');
          }
        }
      } else {
        const result = await signUpEmailPassword(email, password);
        console.log('Sign up result:', result);
        
        if (result && result.isSuccess) {
          if (result.needsEmailVerification) {
            setMessage('Account created! Please check your email and click the verification link to complete signup.');
          } else {
            console.log('Sign up successful, redirecting to /boards');
            router.push('/boards');
          }
        } else {
          console.error('Sign up failed:', result);
          
          if (result?.error?.message) {
            setMessage(`Sign up failed: ${result.error.message}`);
          } else {
            setMessage('Sign up failed. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const isLoading = isSigningIn || isSigningUp;
  const error = signInError || signUpError;

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mr-3">
            🧁
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {message && (
            <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Authentication Error:</strong> {error.message}
              <br />
              <small className="text-red-600">
                {error.message.includes('email') && 'Make sure your email is valid and verified.'}
                {error.message.includes('password') && 'Check your password and try again.'}
                {error.message.includes('network') && 'Check your internet connection.'}
              </small>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Signing In...' : 'Signing Up...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {showDebug && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Authentication not working? Skip it for testing:
              </p>
              <button
                onClick={() => router.push('/boards')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Skip Auth (Testing Only)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

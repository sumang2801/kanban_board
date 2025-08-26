"use client";

import Link from 'next/link';
import { useGetBoardsQuery } from '@/graphql/generated-types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSignOut, useUserData } from '@nhost/react';
import { useRouter } from 'next/navigation';

function BoardsList() {
  const { data, loading, error } = useGetBoardsQuery();

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-4 text-lg text-gray-500">Loading boards...</span>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center p-8">
      <p>Error loading boards: {error.message}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
      {data?.boards?.map((board: any) => (
        <Link
          key={board.id}
          href={`/boards/${board.id}`}
          className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 hover:shadow-lg border border-gray-200 dark:border-zinc-800 hover:scale-105 transition-all cursor-pointer block"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {board.name}
            </h3>
            <div className="w-8 h-8 bg-orange-400 rounded-lg flex items-center justify-center">
              🪶
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {board.description || 'No description'}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Kanban</span>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
              {board.columns?.length || 0} columns
            </span>
          </div>
        </Link>
      ))}
      
      {(!data?.boards || data.boards.length === 0) && (
        <div className="col-span-full text-center p-12 text-gray-500">
          <div className="text-6xl mb-4">🪶</div>
          <h3 className="text-xl font-semibold mb-2">No boards yet</h3>
          <p>Create your first Kanban board to get started!</p>
        </div>
      )}
    </div>
  );
}

export default function BoardsPage() {
  const { signOut } = useSignOut();
  const user = useUserData();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                My Boards
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Organize your projects with Kanban boards
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    Welcome, {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <BoardsList />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

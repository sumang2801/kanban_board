import { useBoardSubscription } from '@/hooks/useBoardSubscription';

interface SubscriptionTestProps {
  boardId: string;
}

export default function SubscriptionTest({ boardId }: SubscriptionTestProps) {
  const {
    isConnected,
    connectionError,
    loading,
    error,
    boardData,
  } = useBoardSubscription({
    boardId,
    onBoardUpdate: (data) => {
      console.log('🧪 Test component received board update:', data);
    },
  });

  if (loading) {
    return (
      <div className="fixed bottom-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Connecting to GraphQL subscriptions...</span>
        </div>
      </div>
    );
  }

  if (error || connectionError) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-100 border border-red-300 rounded-lg p-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Subscription Error: {error?.message || connectionError}</span>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="fixed bottom-4 left-4 bg-green-100 border border-green-300 rounded-lg p-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span>GraphQL Subscriptions Active</span>
        </div>
        {boardData && (
          <div className="mt-1 text-xs text-gray-600">
            Board: {boardData.boards_by_pk?.name || 'Unknown'} ({boardData.boards_by_pk?.columns?.length || 0} columns)
          </div>
        )}
      </div>
    );
  }

  return null;
}

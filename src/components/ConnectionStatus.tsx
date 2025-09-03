export default function ConnectionStatus({ 
  boardId, 
  subscriptionConnected, 
  subscriptionError 
}: { 
  boardId: string;
  subscriptionConnected?: boolean;
  subscriptionError?: string | null;
}) {
  if (!subscriptionConnected) {
    return subscriptionError ? (
      <div className="fixed top-4 right-4 z-50">
        <div 
          className="w-3 h-3 bg-red-500 rounded-full shadow-lg"
          title={`GraphQL Subscription Error: ${subscriptionError}`}
        ></div>
      </div>
    ) : null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"
        title={`GraphQL Subscriptions Active - Board: ${boardId.slice(0, 8)}...`}
      ></div>
    </div>
  );
}
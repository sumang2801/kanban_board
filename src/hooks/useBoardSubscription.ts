import { useEffect, useState } from 'react';
import { useSubscription, useApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';
import { GetBoardDocument } from '@/graphql/generated-types';

// Board subscription for real-time updates
const BOARD_SUBSCRIPTION = gql`
  subscription BoardSubscription($id: uuid!) {
    boards_by_pk(id: $id) {
      id
      name
      columns {
        id
        name
        board_id
        cards {
          id
          title
          description
          column_id
        }
      }
    }
  }
`;

interface UseBoardSubscriptionProps {
  boardId: string;
  onBoardUpdate?: (data: any) => void;
}

export function useBoardSubscription({
  boardId,
  onBoardUpdate,
}: UseBoardSubscriptionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const client = useApolloClient();

  // Subscribe to board changes
  const {
    data: boardData,
    loading: boardLoading,
    error: boardError,
  } = useSubscription(BOARD_SUBSCRIPTION, {
    variables: { id: boardId },
    onData: ({ data }) => {
      console.log('📡 Board subscription data received:', data.data);
      setIsConnected(true);
      setConnectionError(null);
      
      // TEMPORARILY DISABLED: Update the Apollo cache with subscription data to sync with queries
      // This was causing optimistic updates to be overridden immediately
      /*
      if (data.data?.boards_by_pk) {
        try {
          client.writeQuery({
            query: GetBoardDocument,
            variables: { id: boardId },
            data: {
              boards_by_pk: data.data.boards_by_pk
            },
          });
          console.log('🔄 Updated Apollo cache with subscription data');
        } catch (cacheError) {
          console.warn('⚠️ Failed to update cache:', cacheError);
        }
      }
      */
      
      if (onBoardUpdate && data.data) {
        onBoardUpdate(data.data);
      }
    },
    onError: (error) => {
      console.error('❌ Board subscription error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    },
    onComplete: () => {
      console.log('✅ Board subscription completed');
    },
  });

  useEffect(() => {
    if (!boardLoading && !boardError) {
      setIsConnected(true);
      setConnectionError(null);
    }
  }, [boardLoading, boardError]);

  return {
    isConnected,
    connectionError,
    loading: boardLoading,
    error: boardError,
    boardData,
  };
}

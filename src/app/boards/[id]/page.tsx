"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useGetBoardQuery, useCreateCardMutation, useUpdateCardMutation } from '@/graphql/generated-types';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useSignOut, useUserData, useAuthenticationStatus } from '@nhost/react';
import { multiClientSubscriptionManager } from '@/lib/multiClientSync';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, User } from 'lucide-react';

interface Card {
  id: string;
  title: string;
  description?: string;
}

interface Column {
  id: string;
  name: string;
  cards: Card[];
  color: string;
  bgColor: string;
  addButtonColor: string;
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const { signOut } = useSignOut();
  const user = useUserData();
  const { isAuthenticated, isLoading } = useAuthenticationStatus();

  const { data: graphqlData, loading: graphqlLoading, error: graphqlError, refetch } = useGetBoardQuery({
    variables: { id: boardId },
    fetchPolicy: 'cache-first', // Use cached data first, only fetch from network if not in cache
    notifyOnNetworkStatusChange: false // Don't notify on network changes to prevent re-renders
  });

  // Column mapping for multi-client sync (maps GraphQL UUIDs to standard column IDs)
  const [columnMapping, setColumnMapping] = useState<Map<string, string>>(new Map());
  const [reverseColumnMapping, setReverseColumnMapping] = useState<Map<string, string>>(new Map());
  const [columns, setColumns] = useState<Column[]>([]);
  const [forceReloadCounter, setForceReloadCounter] = useState(0);

  // Color scheme for columns - vibrant colors like Monday.com style
  const columnColors = useMemo(() => [
    {
      color: 'text-white',
      bgColor: 'bg-red-500', 
      addButtonColor: 'bg-red-600 hover:bg-red-700'
    },
    {
      color: 'text-white',
      bgColor: 'bg-blue-500', 
      addButtonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      color: 'text-white',
      bgColor: 'bg-orange-500', 
      addButtonColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      color: 'text-white',
      bgColor: 'bg-green-500', 
      addButtonColor: 'bg-green-600 hover:bg-green-700'
    },
    {
      color: 'text-white',
      bgColor: 'bg-purple-500', 
      addButtonColor: 'bg-purple-600 hover:bg-purple-700'
    }
  ], []);

  // Helper function to load saved cards from localStorage
  const loadColumnsWithLocalStorage = (baseColumns: Column[]) => {
    let columnsWithCards = baseColumns;
    
    try {
      const savedCards = localStorage.getItem(`kanban-cards-${boardId}`);
      if (savedCards) {
        const savedColumns = JSON.parse(savedCards);
        console.log('📦 Loading cards from localStorage:', savedColumns.length, 'columns');
        
        // Merge saved cards with base columns
        columnsWithCards = baseColumns.map(col => {
          const savedCol = savedColumns.find((saved: any) => saved.id === col.id);
          if (savedCol && savedCol.cards) {
            console.log(`📋 Restored ${savedCol.cards.length} cards for column ${col.name}`);
            return { ...col, cards: savedCol.cards };
          }
          return col;
        });
      }
      
      // Also restore column order if it exists
      const savedOrder = localStorage.getItem(`kanban-columns-order-${boardId}`);
      if (savedOrder) {
        const orderedColumns = JSON.parse(savedOrder);
        console.log('🔄 Restoring column order from localStorage');
        
        // Reorder columns based on saved order, preserving any new columns
        const reorderedColumns: Column[] = [];
        
        // First, add columns in the saved order
        orderedColumns.forEach((savedCol: any) => {
          const matchingCol = columnsWithCards.find(col => col.id === savedCol.id);
          if (matchingCol) {
            reorderedColumns.push(matchingCol);
          }
        });
        
        // Then add any new columns that weren't in the saved order
        columnsWithCards.forEach(col => {
          if (!reorderedColumns.find(orderedCol => orderedCol.id === col.id)) {
            reorderedColumns.push(col);
          }
        });
        
        return reorderedColumns;
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to load cards/order from localStorage:', error);
    }
    
    return columnsWithCards;
  };

  // Subscribe to multi-client updates via Server-Sent Events
  // This effect runs after column mapping is established
  useEffect(() => {
    if (reverseColumnMapping.size === 0 || columns.length === 0) {
      console.log('⏳ Waiting for column mapping and data to be ready before subscribing');
      return;
    }

    console.log('🔄 Setting up multi-client subscription with ready column mapping');
    
    // Force disconnect any existing subscription first
    const cleanup = () => {
      console.log('🧹 Cleaning up previous subscription');
      multiClientSubscriptionManager.forceDisconnect();
    };
    
    cleanup();
    
    // Small delay to ensure cleanup completes
    const timer = setTimeout(() => {
      const unsubscribe = multiClientSubscriptionManager.subscribe(boardId, (data) => {
        console.log('🌐 Received multi-client update:', data);
        console.log('🏗️ Current columns:', columns.map((c: any) => ({ id: c.id, name: c.name, cards: c.cards.length })));
        
        if (data.type === 'board_update') {
          const { updateType, data: updateData } = data;
          
          switch (updateType) {
            case 'card_moved':
              // Handle card movement from other clients
              const { cardId, fromColumnId, toColumnId, toIndex: cardToIndex } = updateData;
              console.log(`🚚 Processing card move: ${cardId} from ${fromColumnId} to ${toColumnId} at index ${cardToIndex}`);
              
              setColumns(prevColumns => {
                const newColumns = [...prevColumns];
                
                // Map standard column IDs to actual GraphQL column IDs
                let actualFromColumnId = fromColumnId;
                let actualToColumnId = toColumnId;
                
                if (reverseColumnMapping.size > 0) {
                  actualFromColumnId = reverseColumnMapping.get(fromColumnId) || fromColumnId;
                  actualToColumnId = reverseColumnMapping.get(toColumnId) || toColumnId;
                  console.log(`🗺️ Mapped column IDs: ${fromColumnId}->${actualFromColumnId}, ${toColumnId}->${actualToColumnId}`);
                }
                
                const fromColumn = newColumns.find(col => col.id === actualFromColumnId);
                const toColumn = newColumns.find(col => col.id === actualToColumnId);
                
                console.log('🔍 Found columns:', { 
                  fromColumn: fromColumn ? `${fromColumn.id} (${fromColumn.name})` : 'null',
                  toColumn: toColumn ? `${toColumn.id} (${toColumn.name})` : 'null'
                });
                
                if (fromColumn && toColumn) {
                  const cardIndex = fromColumn.cards.findIndex(card => card.id === cardId);
                  console.log(`🎯 Card index in source column: ${cardIndex}`);
                  
                  if (cardIndex !== -1) {
                    const [movedCard] = fromColumn.cards.splice(cardIndex, 1);
                    toColumn.cards.splice(cardToIndex, 0, movedCard);
                    console.log('✅ Card moved in UI state');
                  } else {
                    console.log('⚠️ Card not found in source column, possibly already moved');
                  }
                } else {
                  console.log('❌ Could not find source or destination column');
                }
                
                return newColumns;
              });
              break;
              
            case 'card_created':
              // Handle new card creation from other clients
              const { card, columnId } = updateData;
              console.log(`📝 Processing card creation: ${card.title} in column ${columnId}`);
              
              setColumns(prevColumns => {
                const newColumns = [...prevColumns];
                
                // Map standard column ID to actual GraphQL column ID
                let actualColumnId = columnId;
                if (reverseColumnMapping.size > 0) {
                  actualColumnId = reverseColumnMapping.get(columnId) || columnId;
                  console.log(`🗺️ Mapped column ID: ${columnId}->${actualColumnId}`);
                }
                
                const targetColumn = newColumns.find(col => col.id === actualColumnId);
                
                console.log('🔍 Target column found:', targetColumn ? `${targetColumn.id} (${targetColumn.name})` : 'null');
                
                if (targetColumn) {
                  // Check if card already exists to avoid duplicates
                  if (!targetColumn.cards.find(c => c.id === card.id)) {
                    targetColumn.cards.push(card);
                    console.log('✅ Card added to UI state');
                  } else {
                    console.log('⚠️ Card already exists, skipping duplicate');
                  }
                } else {
                  console.log('❌ Target column not found');
                }
                
                return newColumns;
              });
              break;
              
            case 'card_updated':
              // Handle card updates from other clients
              const { updatedCard } = updateData;
              
              setColumns(prevColumns => {
                const newColumns = [...prevColumns];
                
                for (const column of newColumns) {
                  const cardIndex = column.cards.findIndex(c => c.id === updatedCard.id);
                  if (cardIndex !== -1) {
                    column.cards[cardIndex] = { ...column.cards[cardIndex], ...updatedCard };
                    break;
                  }
                }
                
                return newColumns;
              });
              break;
              
            case 'column_reordered':
              // Handle column reordering from other clients
              const { columnId: reorderedColumnId, fromIndex, toIndex: columnToIndex } = updateData;
              console.log(`🔄 Processing column reorder: column ${reorderedColumnId} from index ${fromIndex} to ${columnToIndex}`);
              
              setColumns(prevColumns => {
                const newColumns = [...prevColumns];
                
                // Find the column being moved
                const columnIndex = newColumns.findIndex(col => col.id === reorderedColumnId);
                
                if (columnIndex !== -1) {
                  // Remove the column from its current position
                  const [movedColumn] = newColumns.splice(columnIndex, 1);
                  // Insert it at the new position
                  newColumns.splice(columnToIndex, 0, movedColumn);
                  console.log('✅ Column reordered in UI state');
                  
                  // Save the new order to localStorage
                  localStorage.setItem(`kanban-columns-order-${boardId}`, JSON.stringify(newColumns));
                } else {
                  console.log('❌ Column to reorder not found');
                }
                
                return newColumns;
              });
              break;
          }
        }
      });

      return unsubscribe;
    }, 100);
    
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [boardId, reverseColumnMapping, columns.length]); // Only depend on columns.length, not the entire array

  // GraphQL mutations
  const [createCard] = useCreateCardMutation();
  const [updateCard] = useUpdateCardMutation();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const handleAddCard = async (columnId: string) => {
    const title = prompt('Card title:');
    const description = prompt('Card description (optional):') || '';

    if (!title?.trim()) return;

    console.log(`🎯 Creating card in column: ${columnId}`);

    // Check if this is a temporary column (no real database column)
    const isTemporaryColumn = columnId.startsWith('temp-');

    if (isTemporaryColumn) {
      console.log('⚠️ Creating card in temporary column (local only)');
      
      // Create local-only card for temporary columns
      const newCard = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        description: description.trim()
      };

      const updatedColumns = columns.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: [...col.cards, newCard] };
        }
        return col;
      });

      setColumns(updatedColumns);
      
      // Store cards in localStorage for persistence across navigation
      localStorage.setItem(`kanban-cards-${boardId}`, JSON.stringify(updatedColumns));
      
      // Broadcast to other clients using standard column ID for real-time sync
      const standardColumnId = columnMapping.get(columnId) || columnId.replace('temp-', '');
      multiClientSubscriptionManager.broadcastUpdate(boardId, 'card_created', {
        card: newCard,
        columnId: standardColumnId
      });
      
      console.log('✅ Card created locally, saved to localStorage, and broadcasted');
      return;
    }

    try {
      console.log('💾 Attempting GraphQL card creation');
      const result = await createCard({
        variables: {
          title: title.trim(),
          description: description.trim(),
          column_id: columnId
        }
      });
      
      console.log('✅ Card creation result:', result);
      
      // Add optimistic update immediately after successful creation
      if (result.data?.insert_cards_one) {
        const createdCard = result.data.insert_cards_one;
        console.log('🎉 Card successfully created:', createdCard);
        
        // Add card to UI immediately
        setColumns(prevColumns => {
          const updatedColumns = prevColumns.map(col => {
            if (col.id === columnId) {
              // Check if card already exists to avoid duplicates
              const cardExists = col.cards.find(card => card.id === createdCard.id);
              if (!cardExists) {
                console.log(`✨ Adding card "${createdCard.title}" to column "${col.name}"`);
                return { ...col, cards: [...col.cards, createdCard] };
              }
            }
            return col;
          });
          
          // Save updated columns to localStorage
          localStorage.setItem(`kanban-cards-${boardId}`, JSON.stringify(updatedColumns));
          console.log('💾 Updated columns saved to localStorage');
          
          return updatedColumns;
        });
        
        // Broadcast to other clients using standard column ID
        const standardColumnId = columnMapping.get(columnId) || columnId;
        
        multiClientSubscriptionManager.broadcastUpdate(boardId, 'card_created', {
          card: {
            id: createdCard.id,
            title: createdCard.title,
            description: createdCard.description
          },
          columnId: standardColumnId
        });
        console.log(`📡 Broadcasted card creation with standard column ID: ${standardColumnId}`);
      }
      
      // DON'T refetch - this was causing cards to disappear
      // await refetch();
      console.log('✅ Card added without refetch to prevent disappearing');
    } catch (error) {
      console.error('❌ Error creating card, using local fallback:', error);
      
      // Fallback to local-only card
      const newCard = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        description: description.trim()
      };

      const updatedColumns = columns.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: [...col.cards, newCard] };
        }
        return col;
      });

      setColumns(updatedColumns);
      
      // Store in localStorage
      localStorage.setItem(`kanban-cards-${boardId}`, JSON.stringify(updatedColumns));
      
      console.log('🔧 Card added locally as fallback and saved to localStorage');
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    console.log('🎯 Drag operation:', {
      type: type,
      from: { droppableId: source.droppableId, index: source.index },
      to: { droppableId: destination.droppableId, index: destination.index }
    });

    // Handle column reordering
    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);
      
      setColumns(newColumns);
      
      // Save column order to localStorage
      localStorage.setItem(`kanban-columns-order-${boardId}`, JSON.stringify(newColumns));
      
      console.log('🔄 Column reordered and saved to localStorage');
      
      // Broadcast column reorder for real-time sync
      multiClientSubscriptionManager.broadcastUpdate(boardId, 'column_reordered', {
        columnId: movedColumn.id,
        fromIndex: source.index,
        toIndex: destination.index
      });
      
      return;
    }

    // Handle card dragging between columns (existing logic)
    const newColumns = Array.from(columns);
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Remove card from source
    const [movedCard] = sourceColumn.cards.splice(source.index, 1);

    // Add card to destination
    destColumn.cards.splice(destination.index, 0, movedCard);

    setColumns(newColumns);

    // Save to localStorage for temporary columns
    localStorage.setItem(`kanban-cards-${boardId}`, JSON.stringify(newColumns));

    // Broadcast the move for real-time sync
    const standardFromColumnId = columnMapping.get(source.droppableId) || source.droppableId.replace('temp-', '');
    const standardToColumnId = columnMapping.get(destination.droppableId) || destination.droppableId.replace('temp-', '');

    multiClientSubscriptionManager.broadcastUpdate(boardId, 'card_moved', {
      cardId: movedCard.id,
      fromColumnId: standardFromColumnId,
      toColumnId: standardToColumnId,
      toIndex: destination.index
    });

    console.log('✅ Card moved locally and broadcasted');

    // Try to update database if not using temporary columns
    const isTemporaryMove = source.droppableId.startsWith('temp-') || destination.droppableId.startsWith('temp-');
    if (!isTemporaryMove) {
      try {
        await updateCard({
          variables: {
            id: movedCard.id,
            column_id: destination.droppableId
          }
        });
        console.log('💾 Card position updated in database');
      } catch (error) {
        console.warn('⚠️ Failed to update card in database:', error);
      }
    }
  };

  // Load GraphQL data and create column mapping
  useEffect(() => {
    const defaultNames = ['To Do', 'In Progress', 'Done'];
    const standardColumnIds = ['col-1', 'col-2', 'col-3'];
    
    // Check if we have GraphQL data with columns
    if (graphqlData?.boards_by_pk?.columns && graphqlData.boards_by_pk.columns.length > 0) {
      // Use GraphQL data
      const newColumnMapping = new Map<string, string>();
      const newReverseMapping = new Map<string, string>();
      
      const newColumns = graphqlData.boards_by_pk.columns.map((col: any, index: number) => {
        const standardId = standardColumnIds[index] || `col-${index + 1}`;
        newColumnMapping.set(col.id, standardId);
        newReverseMapping.set(standardId, col.id);
        
        return {
          id: col.id, // Keep original ID for GraphQL operations
          standardId: standardId, // Add standard ID for multi-client sync
          name: defaultNames[index] || `Column ${index + 1}`,
          cards: col.cards?.map((card: any) => ({
            id: card.id,
            title: card.title,
            description: card.description || ''
          })) || [],
          ...columnColors[index % columnColors.length]
        };
      });
      
      const columnsWithCards = loadColumnsWithLocalStorage(newColumns);
      
      setColumnMapping(newColumnMapping);
      setReverseColumnMapping(newReverseMapping);
      setColumns(columnsWithCards);
      console.log('✅ GraphQL data loaded');
      console.log('📊 GraphQL columns structure:', columnsWithCards.map((c: any) => ({ id: c.id, standardId: c.standardId, name: c.name, cardCount: c.cards.length })));
      console.log('🗺️ Column mapping created:', Object.fromEntries(newColumnMapping));
    } else if (graphqlData && !graphqlLoading) {
      // GraphQL returned but no columns found, create default empty columns
      console.log('⚠️ No columns found in GraphQL response, creating default columns');
      
      const newColumnMapping = new Map<string, string>();
      const newReverseMapping = new Map<string, string>();
      
      const newColumns = defaultNames.map((name, index) => {
        const standardId = standardColumnIds[index];
        const tempId = `temp-${standardId}`; // Temporary ID for columns that don't exist in DB
        
        newColumnMapping.set(tempId, standardId);
        newReverseMapping.set(standardId, tempId);
        
        return {
          id: tempId,
          standardId: standardId,
          name: name,
          cards: [],
          ...columnColors[index % columnColors.length]
        };
      });
      
      const columnsWithCards = loadColumnsWithLocalStorage(newColumns);
      
      setColumnMapping(newColumnMapping);
      setReverseColumnMapping(newReverseMapping);
      setColumns(columnsWithCards);
      console.log('📋 Created default columns with saved cards');
    }
  }, [graphqlData, graphqlLoading, boardId, columnColors, forceReloadCounter]);

  // Note: Removed aggressive mount refetch - let GraphQL query handle initial loading naturally

  // Refetch data when page becomes visible (user navigates back)
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && columns.length === 0) {
        console.log('🔄 Page became visible with no columns, refetching board data');
        refetch();
        setForceReloadCounter(prev => prev + 1);
      }
    };

    const handleFocus = () => {
      // Clear any existing timeout
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
      
      // Only refetch if we have no columns after a short delay
      focusTimeout = setTimeout(() => {
        if (columns.length === 0) {
          console.log('🎯 Window focused with no columns, refetching board data');
          refetch();
          setForceReloadCounter(prev => prev + 1);
        }
      }, 500); // 500ms delay to avoid excessive refetches
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch, columns.length]);

  // Emergency localStorage restore - if columns are empty but localStorage has data, restore it
  useEffect(() => {
    let restoreTimeout: NodeJS.Timeout;
    
    // Only run if we have empty columns, not loading, and no errors
    if (columns.length === 0 && !graphqlLoading && !graphqlError) {
      console.log('⚡ Emergency check: columns are empty, checking localStorage');
      
      // Add a small delay to avoid rapid state updates
      restoreTimeout = setTimeout(() => {
        try {
          const savedCards = localStorage.getItem(`kanban-cards-${boardId}`);
          if (savedCards) {
            const savedColumns = JSON.parse(savedCards);
            if (savedColumns.length > 0 && savedColumns.some((col: any) => col.cards && col.cards.length > 0)) {
              console.log('🚨 Found cards in localStorage but columns are empty! Restoring...');
              setColumns(savedColumns);
              
              // Also update mapping if needed
              const newColumnMapping = new Map<string, string>();
              const newReverseMapping = new Map<string, string>();
              
              savedColumns.forEach((col: any) => {
                if (col.standardId) {
                  newColumnMapping.set(col.id, col.standardId);
                  newReverseMapping.set(col.standardId, col.id);
                }
              });
              
              if (newColumnMapping.size > 0) {
                setColumnMapping(newColumnMapping);
                setReverseColumnMapping(newReverseMapping);
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed emergency localStorage restore:', error);
        }
      }, 100); // Small delay to prevent rapid updates
    }
    
    return () => {
      if (restoreTimeout) {
        clearTimeout(restoreTimeout);
      }
    };
  }, [columns.length, boardId, graphqlLoading, graphqlError]);

  // Refetch data when authentication state changes (user signs in)
  useEffect(() => {
    if (isAuthenticated && !isLoading && columns.length === 0) {
      console.log('🔐 Authentication state changed (user signed in), refetching board data');
      refetch();
      setForceReloadCounter(prev => prev + 1);
    }
  }, [isAuthenticated, isLoading, refetch, columns.length]);

  // Listen for auth bypass events
  useEffect(() => {
    const handleAuthBypass = () => {
      if (columns.length === 0) {
        console.log('🔓 Auth bypass activated, refetching board data');
        refetch();
        setForceReloadCounter(prev => prev + 1);
      }
    };

    window.addEventListener('auth-bypass-activated', handleAuthBypass);
    return () => {
      window.removeEventListener('auth-bypass-activated', handleAuthBypass);
    };
  }, [refetch, columns.length]);

  const OLD_handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    console.log('🎯 Drag operation started:', {
      from: { columnId: source.droppableId, index: source.index },
      to: destination ? { columnId: destination.droppableId, index: destination.index } : 'cancelled'
    });

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('📍 No position change, skipping update');
      return;
    }

    const newColumns = Array.from(columns);
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      console.error('❌ Could not find source or destination column');
      return;
    }

    console.log(`📋 Before move - Source: ${sourceColumn.cards.length} cards, Dest: ${destColumn.cards.length} cards`);

    const [movedCard] = sourceColumn.cards.splice(source.index, 1);
    destColumn.cards.splice(destination.index, 0, movedCard);

    console.log(`📋 After move - Source: ${sourceColumn.cards.length} cards, Dest: ${destColumn.cards.length} cards`);
    console.log(`� Moving "${movedCard.title}" from ${sourceColumn.name} to ${destColumn.name}`);

    // Optimistically update the UI
    setColumns(newColumns);
    console.log('✅ UI state updated');
    
    console.log('🌐 Using GraphQL to persist change...');
    try {
      await updateCard({
        variables: {
          id: movedCard.id,
          column_id: destination.droppableId
        }
      });
      console.log('✅ Card moved successfully in database');
      
      // Broadcast to other clients using standard column IDs
      const standardFromColumnId = columnMapping.get(source.droppableId) || source.droppableId;
      const standardToColumnId = columnMapping.get(destination.droppableId) || destination.droppableId;
      
      multiClientSubscriptionManager.broadcastUpdate(boardId, 'card_moved', {
        cardId: movedCard.id,
        fromColumnId: standardFromColumnId,
        toColumnId: standardToColumnId,
        toIndex: destination.index,
        card: movedCard
      });
      console.log(`📡 Broadcasted card move with standard IDs: ${standardFromColumnId} -> ${standardToColumnId}`);
      
    } catch (error) {
      console.error('❌ Error moving card, reverting:', error);
      // Revert the optimistic update on error
      refetch();
    }
  };

  const OLD_handleAddCard = async (columnId: string) => {
    console.log('🚀 Starting card creation process...');
    console.log('Column ID:', columnId);
    console.log('Available columns:', columns.map(c => ({ id: c.id, name: c.name, cardCount: c.cards.length })));
    
    const title = prompt('Enter card title:');
    if (!title?.trim()) {
      console.log('❌ No title provided, aborting card creation');
      return;
    }

    const description = prompt('Enter card description (optional):') || '';
    console.log('📝 Creating card with:', { title: title.trim(), description: description.trim(), column_id: columnId });

    // Use GraphQL mutation
    try {
      const result = await createCard({
        variables: {
          title: title.trim(),
          description: description.trim(),
          column_id: columnId
        }
      });
      
      console.log('✅ Card creation result:', result);
      
      // Broadcast to other clients using standard column ID
      if (result.data?.insert_cards_one) {
        const createdCard = result.data.insert_cards_one;
        const standardColumnId = columnMapping.get(columnId) || columnId;
        
        multiClientSubscriptionManager.broadcastUpdate(boardId, 'card_created', {
          card: {
            id: createdCard.id,
            title: createdCard.title,
            description: createdCard.description
          },
          columnId: standardColumnId
        });
        console.log(`📡 Broadcasted card creation with standard column ID: ${standardColumnId}`);
      }
      
      // Refetch the board data to get the new card
      await refetch();
      console.log('📊 Board data refetched');
    } catch (error) {
      console.error('❌ Error creating card, using local fallback:', error);
      
      // Fallback to local-only card
      const newCard = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        description: description.trim()
      };

      const updatedColumns = columns.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: [...col.cards, newCard] };
        }
        return col;
      });

      setColumns(updatedColumns);
      console.log('🔧 Card added locally as fallback');
    }
  };

  if (graphqlLoading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-800">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-4 text-xl text-white">Loading board...</span>
    </div>
  );

  if (graphqlError) return (
    <div className="text-red-400 text-center p-8 min-h-screen bg-slate-800 flex items-center justify-center">
      <div>
        <p className="text-xl mb-4">Error loading board: {graphqlError.message}</p>
        <button 
          onClick={() => router.push('/boards')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Boards
        </button>
      </div>
    </div>
  );

  const board = graphqlData?.boards_by_pk;

  if (!board) return (
    <div className="text-center p-8 min-h-screen bg-background flex items-center justify-center">
      <div>
        <p className="text-xl mb-4 text-foreground">Board not found</p>
        <Button 
          onClick={() => router.push('/boards')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Back to Boards
        </Button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-muted/50 border-r p-6 flex-shrink-0">
        <div className="mb-8">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => router.push('/boards')}
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            ← Back to Boards
          </Button>
          
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center mr-3">
              🧁
            </div>
            <h1 className="text-foreground text-xl font-bold">{board.name}</h1>
          </div>
          <p className="text-muted-foreground text-sm">Kanban</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-foreground text-sm font-medium mb-3">Kanban Column</h3>
            <Select defaultValue="delivered">
              <SelectTrigger>
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="text-foreground text-sm font-medium mb-3">Assignee Column</h3>
            <Select defaultValue="person">
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User info and sign out */}
          {user?.email && (
            <div className="pt-4 border-t border-border">
              <p className="text-muted-foreground text-sm mb-2">Signed in as:</p>
              <p className="text-foreground text-sm mb-3">{user.email}</p>
              <Button
                onClick={handleSignOut}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="COLUMN">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex space-x-6 overflow-x-auto ${
                  snapshot.isDraggingOver ? 'bg-slate-700/20 rounded-lg p-4' : ''
                } transition-colors min-h-[600px]`}
              >
                {columns.map((column, index) => (
                  <Draggable key={column.id} draggableId={column.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex-shrink-0 w-80 ${
                          snapshot.isDragging ? 'rotate-3 scale-105 shadow-2xl' : ''
                        } transition-all duration-200`}
                      >
                        <div className={`rounded-lg border min-h-[500px] shadow-sm ${column.bgColor || 'bg-card'}`}>
                          <div 
                            {...provided.dragHandleProps}
                            className="flex items-center justify-between p-4 mb-4 cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-2">
                              <MoreHorizontal className={`w-4 h-4 ${column.color || 'text-muted-foreground'}`} />
                              <h3 className={`font-semibold text-lg ${column.color || 'text-foreground'}`}>
                                {column.name}
                              </h3>
                              <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                                {column.cards.length}
                              </Badge>
                            </div>
                          </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 mb-4 px-4 ${
                          snapshot.isDraggingOver ? 'bg-white/20 rounded-lg p-2' : ''
                        } transition-colors min-h-[200px]`}
                      >
                        {column.cards.map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(provided, snapshot) => (
                              <UICard
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-move transition-all ${
                                  snapshot.isDragging ? 'shadow-xl rotate-2 scale-105' : 'hover:shadow-md'
                                }`}
                              >
                                <CardContent className="p-4">
                                  <CardTitle className="text-sm font-medium text-foreground mb-2">
                                    {card.title}
                                  </CardTitle>
                                  {card.description && (
                                    <CardDescription className="text-xs text-muted-foreground mb-3">
                                      {card.description}
                                    </CardDescription>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex space-x-1">
                                      <Badge variant="secondary" className="w-6 h-6 p-0 rounded-full">
                                        <User className="w-3 h-3" />
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </UICard>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Pulse Button */}
                  <div className="px-4 pb-4">
                    <Button 
                      onClick={() => handleAddCard(column.id)}
                      className={`w-full ${column.addButtonColor || 'bg-primary hover:bg-primary/90'} text-white border-0`}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add pulse
                    </Button>
                  </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Empty state if no columns */}
        {columns.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <div className="text-6xl mb-4">�</div>
            <h3 className="text-xl font-semibold mb-2">No columns yet</h3>
            <p>Add columns to organize your tasks</p>
          </div>
        )}
      </div>
    </div>
    <ConnectionStatus boardId={boardId} />
    </ProtectedRoute>
  );
}

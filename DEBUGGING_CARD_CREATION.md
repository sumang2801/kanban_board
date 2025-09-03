# Testing GraphQL Subscriptions - Card Creation Issue

## Problem
When adding a new card:
- ✅ Card is created successfully in the database (GraphQL mutation works)
- ❌ Card does not appear in the frontend UI immediately
- ❌ User has to refresh page to see the new card

## Root Cause Analysis
The issue is likely one of these:

1. **Cache Synchronization**: GraphQL subscription updates the cache, but the UI doesn't re-render
2. **Local State vs Cache**: Board page uses local `columns` state instead of GraphQL cache data
3. **Subscription Timing**: Subscription might not be active or receiving updates
4. **WebSocket Connection**: WebSocket connection for subscriptions might not be working

## Debugging Steps

### 1. Check WebSocket Connection
Open browser DevTools → Network tab → WS filter
- Should see a WebSocket connection to Hasura
- Should show `graphql-ws` protocol messages

### 2. Check Console Logs
Look for these log messages:
- `📡 Board subscription data received:` - Subscription is receiving data
- `🔄 Updated Apollo cache with subscription data` - Cache is being updated
- `🔄 Processing GraphQL data update (query or subscription)` - UI is processing updates
- `✅ GraphQL data processed and UI updated` - UI state updated

### 3. Test Card Creation
1. Navigate to a board: http://localhost:3000/boards/[boardId]
2. Click "+ Add Card" button
3. Enter card title and description
4. Check console for:
   - `✅ Card creation result:` - GraphQL mutation succeeded
   - `📡 Subscription will automatically update the UI` - Subscription should handle UI update

### 4. Check Subscription Test Component
Look for the test panel in bottom-left corner:
- 🟢 Green = GraphQL subscriptions active
- 🔴 Red = Connection error
- Should show board name and column count

## Quick Fix Options

### Option 1: Force Cache Refresh (Current Implementation)
The `onBoardUpdate` callback now triggers `setForceReloadCounter(prev => prev + 1)` which should force the useEffect to re-run and update the UI.

### Option 2: Use GraphQL Data Directly (Alternative)
Instead of local `columns` state, render directly from `graphqlData.boards_by_pk.columns`.

### Option 3: Manual Cache Update (Fallback)
If subscriptions aren't working, add a manual cache update after card creation.

## Test Commands

```bash
# Check if GraphQL subscription queries are valid
cd /home/suman/Documents/kanban_board
pnpm run codegen

# Check browser console for WebSocket connection
# Should see: ws://localhost:3000/_next/webpack-hmr (Hot reload)
# Should see: wss://xakuxhqdhfmxusxlsfku.hasura.us-east-1.nhost.run/v1/graphql (GraphQL subscriptions)

# Test with multiple browser tabs to verify real-time sync
```

## Expected Behavior After Fix
1. Create a card in Tab 1
2. Card should immediately appear in Tab 1 (via local optimistic update)
3. Card should immediately appear in Tab 2 (via GraphQL subscription)
4. Both tabs should show the same state without refresh

## Current Status
✅ GraphQL mutations working (database updates)  
✅ GraphQL subscriptions configured  
✅ WebSocket transport set up  
🔄 UI update mechanism being fixed  
⚠️ Need to test real-time sync behavior  

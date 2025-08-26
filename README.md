# Kanban Board with Real-time Sync

A Next.js 15 Kanban board application with GraphQL backend powered by Nhost/Hasura, featuring advanced drag-and-drop capabilities and real-time multi-client synchronization.

## ✨ Features

- **Advanced Drag & Drop**: 
  - Move cards between columns with smooth animations
  - **Draggable columns** with horizontal reordering
  - Powered by `@hello-pangea/dnd` for optimal performance
- **Real-time Multi-Client Sync**: Server-Sent Events for instant updates across all clients
- **Smart Persistence**: 
  - localStorage fallback for offline functionality
  - Authentication state monitoring for seamless data restoration
- **GraphQL Backend**: Nhost/Hasura with intelligent fallback to mock data
- **Connection Status**: Unobtrusive green dot indicator for real-time connection
- **Authentication**: Secure user authentication with bypass functionality for testing
- **TypeScript**: Full type safety with GraphQL code generation
- **Performance Optimized**: Debounced effects and efficient re-rendering

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🎮 How to Use

1. **Authentication**: Sign in/up or use bypass for testing
2. **Board Navigation**: Browse and select boards
3. **Add Cards**: Click "+" in any column to create new cards
4. **Card Management**: 
   - Drag cards between columns
   - Cards auto-save with real-time sync
5. **Column Reordering**: Drag columns horizontally to reorder
6. **Multi-Client**: Open multiple tabs to see real-time synchronization
7. **Connection Status**: Green dot (top-right) indicates live connection

## 🔧 Database Configuration (Optional)

The app works fully with mock data and localStorage persistence. To enable full database mode:

1. **Check database connection:**
   ```bash
   pnpm run check-mutations
   ```

2. **Configure environment variables:**
   ```bash
   # .env.local
   NEXT_PUBLIC_NHOST_SUBDOMAIN=your-project
   NEXT_PUBLIC_NHOST_REGION=us-east-1
   ```

3. **Restart development server** when database is configured

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 (Turbopack), React, TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: @hello-pangea/dnd
- **Backend**: Nhost/Hasura GraphQL
- **Real-time**: Server-Sent Events (SSE)
- **Authentication**: Nhost Auth
- **State Management**: Apollo Client + localStorage
- **Code Generation**: GraphQL Code Generator

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/              # Authentication pages
│   ├── boards/            # Board listing and kanban board pages
│   ├── countries/         # Countries demo page (GraphQL example)
│   ├── api/
│   │   ├── boards/        # Board update API endpoints
│   │   └── subscribe/     # Server-Sent Events endpoints
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── ConnectionStatus.tsx    # Real-time connection indicator
│   ├── ProtectedRoute.tsx      # Authentication wrapper
│   └── Providers.tsx           # Apollo Client and Nhost providers
├── graphql/
│   ├── generated-types.ts      # Auto-generated TypeScript types
│   └── queries/               # GraphQL queries and mutations
└── lib/
    ├── multiClientSync.ts     # Server-Sent Events manager
    ├── mockDataProvider.ts    # Mock data fallback
    └── nhost.ts              # Nhost client configuration
```

## 🔄 Data Flow & Persistence

- **Primary**: GraphQL mutations with Hasura backend
- **Fallback**: localStorage with authentication state monitoring
- **Real-time**: Server-Sent Events for multi-client synchronization
- **Offline**: Full functionality maintained with localStorage persistence

## � Key Features Deep Dive

### Drag & Drop System
- **Card Dragging**: Move cards between any columns
- **Column Reordering**: Horizontal drag to reorder columns
- **Visual Feedback**: Smooth animations and hover states
- **Multi-device**: Touch and mouse support

### Real-time Synchronization
- **Server-Sent Events**: Instant updates across all connected clients
- **Event Types**: `card_moved`, `card_created`, `column_reordered`
- **Connection Status**: Unobtrusive green dot indicator
- **Automatic Reconnection**: Handles network interruptions gracefully

### Smart Persistence
- **Primary Storage**: GraphQL with Hasura backend
- **Fallback Mode**: localStorage when offline or database unavailable
- **Authentication Sync**: Restores data when switching between auth states
- **Debounced Saves**: Optimized performance with intelligent saving

## 🚀 Development

```bash
# Install dependencies
pnpm install

# Start development server (with Turbopack)
pnpm dev

# Generate GraphQL types
pnpm codegen

# Build for production
pnpm build
```

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sumang2801/kanban_board)

#### Required Environment Variables:
```bash
NEXT_PUBLIC_NHOST_SUBDOMAIN=your-nhost-subdomain
NEXT_PUBLIC_NHOST_REGION=us-east-1
HASURA_GRAPHQL_URL=https://your-subdomain.hasura.region.nhost.run/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret
NEXT_PUBLIC_HASURA_ADMIN_SECRET=your-admin-secret
NEXT_PUBLIC_USE_MOCK_DATA=false
```

📖 **Detailed deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

## 🔐 Environment Configuration

Create a `.env.local` file with your Nhost credentials:

```bash
# Copy from .env.example and fill in your values
NEXT_PUBLIC_NHOST_SUBDOMAIN=your-project-subdomain
NEXT_PUBLIC_NHOST_REGION=your-region
HASURA_GRAPHQL_URL=your-graphql-endpoint
HASURA_ADMIN_SECRET=your-admin-secret
NEXT_PUBLIC_HASURA_ADMIN_SECRET=your-admin-secret
NEXT_PUBLIC_USE_MOCK_DATA=false
```



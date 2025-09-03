# 🎨 Colorful Kanban Board - Monday.com Style

A modern, vibrant Kanban board application built with Next.js 15, featuring Monday.com-inspired colorful columns, real-time synchronization, and a beautiful Shadcn/ui design system.

![Kanban Board Preview](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge&logo=vercel)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sumang2801/kanban_board)

🌐 **Live Demo:** [https://kanban-board-ffcvcmm2w-gurungsus-projects.vercel.app](https://kanban-board-ffcvcmm2w-gurungsus-projects.vercel.app)

## ✨ Features

### 🎨 **Beautiful Design System**
- **Colorful Columns**: Monday.com-inspired vibrant colors (Red, Blue, Orange, Green, Purple)
- **Shadcn/ui Components**: Modern, accessible UI components with consistent design tokens
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Dark Mode Ready**: Built with CSS variables for easy theming

### 🚀 **Advanced Functionality**
- **Drag & Drop Interface**: 
  - Smooth card movement between columns
  - **Draggable columns** with horizontal reordering
  - Visual feedback with animations and hover states
- **Real-time Multi-Client Sync**: Server-Sent Events for instant updates across all clients
- **Smart Card Persistence**: No more disappearing cards - optimistic updates with database sync
- **GraphQL Backend**: Powered by Nhost/Hasura with intelligent fallback system

### 🔧 **Developer Experience**
- **TypeScript**: Full type safety with auto-generated GraphQL types
- **Next.js 15**: Latest features with Turbopack for lightning-fast development
- **Performance Optimized**: Debounced effects, efficient re-rendering, and smart caching
- **Authentication**: Secure user authentication with bypass functionality for testing

## 🎮 How to Use

1. **🔐 Authentication**: Sign in/up or use bypass for testing
2. **📋 Board Navigation**: Browse and select your boards
3. **➕ Add Cards**: Click "Add pulse" in any colorful column
4. **🖱️ Drag & Drop**: 
   - Move cards between columns
   - Reorder columns horizontally
   - Watch real-time sync across multiple tabs
5. **👥 Multi-Client**: Open multiple browser tabs to see live collaboration
6. **🟢 Connection Status**: Green dot indicator shows real-time connection status

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

4. **Experience the magic:**
   - See colorful columns come to life
   - Add cards and watch them sync in real-time
   - Try drag & drop between vibrant columns

## 🎨 Design System

### Color Palette
Our Monday.com-inspired color system brings personality to each workflow stage:

- 🔴 **Red**: Urgent/Stuck items that need immediate attention
- 🔵 **Blue**: Not started items waiting to begin
- 🟠 **Orange**: Working on it - active development
- 🟢 **Green**: Done - completed tasks
- 🟣 **Purple**: Testing/Review phase

### Component Library
Built with [Shadcn/ui](https://ui.shadcn.com/) for consistency and accessibility:

- **Cards**: Clean, modern card design with proper spacing
- **Buttons**: Consistent styling with hover states and focus indicators  
- **Forms**: Input, Textarea, and Select components
- **Badges**: Stylish counters showing card quantities
- **Icons**: Lucide React icons for crisp visuals

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

### Frontend
- **⚡ Next.js 15**: Latest React framework with Turbopack
- **🎨 Tailwind CSS**: Utility-first CSS framework
- **🧩 Shadcn/ui**: Modern component library with accessibility built-in
- **🖱️ React DnD**: Drag and drop with @hello-pangea/dnd
- **📱 Lucide React**: Beautiful, consistent icons

### Backend & Data
- **🗃️ GraphQL**: Type-safe API with Nhost/Hasura
- **🔄 Apollo Client**: Intelligent caching and state management
- **⚡ Real-time**: Server-Sent Events for live collaboration
- **🔐 Nhost Auth**: Secure authentication system

### Developer Tools
- **📘 TypeScript**: Full type safety throughout
- **🤖 GraphQL Codegen**: Auto-generated types and hooks
- **🔧 ESLint & Prettier**: Code quality and formatting
- **📦 PNPM**: Fast, disk space efficient package manager

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/                   # 🔐 Authentication pages
│   ├── boards/                 # 📋 Board listing and kanban views
│   │   └── [id]/              # 🎨 Individual colorful kanban board
│   ├── api/
│   │   ├── boards/            # 📊 Board update API endpoints
│   │   └── subscribe/         # 📡 Server-Sent Events endpoints
│   └── layout.tsx             # 🏗️ Root layout with providers
├── components/
│   ├── ui/                    # 🧩 Shadcn/ui component library
│   │   ├── button.tsx         # 🔘 Styled button components
│   │   ├── card.tsx           # 🃏 Card container components
│   │   ├── input.tsx          # ⌨️ Form input components
│   │   ├── select.tsx         # 📋 Dropdown select components
│   │   └── ...                # ✨ More UI components
│   ├── ConnectionStatus.tsx    # 🟢 Real-time connection indicator
│   ├── ProtectedRoute.tsx     # 🛡️ Authentication wrapper
│   └── Providers.tsx          # 🔧 Apollo Client and Nhost setup
├── graphql/
│   ├── generated-types.ts     # 🤖 Auto-generated TypeScript types
│   ├── createCard.graphql     # ➕ Card creation mutations
│   ├── updateCard.graphql     # ✏️ Card update mutations
│   └── subscriptions.graphql  # 📡 Real-time subscriptions
└── lib/
    ├── multiClientSync.ts     # 🔄 Multi-client synchronization
    ├── apollo.ts              # 🚀 Apollo Client configuration
    └── nhost.ts              # 🔐 Nhost authentication setup
```

## 🎯 Key Features Deep Dive

### 🎨 Colorful Column System
Experience Monday.com-style visual organization:
- **Vibrant Headers**: Each column has its signature color
- **Smart Badges**: Card counts with semi-transparent styling
- **Color-Matched Buttons**: "Add pulse" buttons inherit column colors
- **Visual Hierarchy**: Clear distinction between workflow stages

### 🔄 Real-time Collaboration
Built for teams working together:
- **Instant Updates**: See changes from other users immediately
- **Connection Status**: Unobtrusive indicator shows sync status
- **Event Broadcasting**: Card moves, additions, and updates sync across clients
- **Offline Resilience**: Works seamlessly even when disconnected

### 🖱️ Advanced Drag & Drop
Smooth, intuitive interactions:
- **Multi-directional**: Move cards vertically and columns horizontally
- **Visual Feedback**: Hover states, drag previews, and drop zones
- **Touch Support**: Works perfectly on mobile and tablet devices
- **Performance Optimized**: Smooth 60fps animations

### 🛡️ Smart Data Management
Never lose your work:
- **Optimistic Updates**: UI responds instantly, syncs in background
- **Conflict Resolution**: Intelligent handling of simultaneous edits
- **Fallback Systems**: localStorage backup when offline
- **Authentication Sync**: Data persists across login sessions

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

# Generate GraphQL types from schema
pnpm codegen

# Build for production
pnpm build

# Preview production build
pnpm start
```

## 🌐 Deployment

### 🚀 One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sumang2801/kanban_board)

### 🔧 Manual Deployment

1. **Fork this repository**
2. **Connect to Vercel:**
   - Import your GitHub repository in Vercel dashboard
   - Configure environment variables (see below)
   - Deploy automatically on every push to main

3. **Set Environment Variables:**
   ```bash
   NEXT_PUBLIC_NHOST_SUBDOMAIN=your-nhost-subdomain
   NEXT_PUBLIC_NHOST_REGION=us-east-1
   HASURA_GRAPHQL_URL=https://your-subdomain.hasura.region.nhost.run/v1/graphql
   HASURA_ADMIN_SECRET=your-admin-secret
   NEXT_PUBLIC_HASURA_ADMIN_SECRET=your-admin-secret
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```

📖 **Detailed setup guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

## � Contributing

We welcome contributions! Here's how you can help:

1. **🍴 Fork the repository**
2. **🌟 Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **💾 Commit your changes**: `git commit -m 'Add amazing feature'`
4. **📤 Push to the branch**: `git push origin feature/amazing-feature`
5. **🔀 Open a Pull Request**

### 🏷️ Areas for Contribution
- 🎨 New color themes and customization options
- 📱 Mobile app development (React Native)
- 🔧 Additional integrations (Slack, Trello, etc.)
- 🌐 Internationalization (i18n)
- 📊 Analytics and reporting features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** - For the beautiful component library
- **Monday.com** - Design inspiration for the colorful columns
- **Nhost/Hasura** - Powerful GraphQL backend
- **Vercel** - Seamless deployment platform
- **Next.js Team** - Amazing React framework

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ and lots of ☕ by [sumang2801](https://github.com/sumang2801)

[🌐 Live Demo](https://kanban-board-ffcvcmm2w-gurungsus-projects.vercel.app) • [📚 Documentation](./DEPLOYMENT.md) • [🐛 Report Bug](https://github.com/sumang2801/kanban_board/issues) • [💡 Request Feature](https://github.com/sumang2801/kanban_board/issues)

</div>
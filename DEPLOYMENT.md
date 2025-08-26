# Vercel Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
1. [Vercel account](https://vercel.com)
2. Your Nhost project credentials
3. GitHub repository (already set up ✅)

### Step 1: Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `sumang2801/kanban_board`
4. Select your repository and click "Deploy"

### Step 2: Configure Environment Variables

In your Vercel project settings, add these environment variables:

#### **Required Environment Variables:**

```bash
# Nhost Configuration
NEXT_PUBLIC_NHOST_SUBDOMAIN=xakuxhqdhfmxusxlsfku
NEXT_PUBLIC_NHOST_REGION=us-east-1

# Hasura GraphQL Configuration  
HASURA_GRAPHQL_URL=https://xakuxhqdhfmxusxlsfku.hasura.us-east-1.nhost.run/v1/graphql
HASURA_ADMIN_SECRET=n,bVPl*Za'QvA6z!bd$38LXL;EsDjxw3
NEXT_PUBLIC_HASURA_ADMIN_SECRET=n,bVPl*Za'QvA6z!bd$38LXL;EsDjxw3

# Data Mode (optional - defaults to database mode)
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Step 3: Add Environment Variables to Vercel

#### Method 1: Via Vercel Dashboard
1. Go to your project on Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable one by one:
   - **Name**: `NEXT_PUBLIC_NHOST_SUBDOMAIN`
   - **Value**: `xakuxhqdhfmxusxlsfku`
   - **Environment**: Production, Preview, Development (select all)
4. Repeat for each variable above

#### Method 2: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_NHOST_SUBDOMAIN
vercel env add NEXT_PUBLIC_NHOST_REGION  
vercel env add HASURA_GRAPHQL_URL
vercel env add HASURA_ADMIN_SECRET
vercel env add NEXT_PUBLIC_HASURA_ADMIN_SECRET
vercel env add NEXT_PUBLIC_USE_MOCK_DATA
```

### Step 4: Deploy
```bash
# Deploy to production
vercel --prod
```

## 🔧 Configuration Details

### **Environment Variable Breakdown:**

| Variable | Purpose | Visibility |
|----------|---------|------------|
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | Nhost project subdomain | Client-side ✅ |
| `NEXT_PUBLIC_NHOST_REGION` | Nhost hosting region | Client-side ✅ |
| `HASURA_GRAPHQL_URL` | GraphQL endpoint URL | Server-side 🔒 |
| `HASURA_ADMIN_SECRET` | Admin access to Hasura | Server-side 🔒 |
| `NEXT_PUBLIC_HASURA_ADMIN_SECRET` | Client GraphQL access | Client-side ✅ |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Enable/disable mock data fallback | Client-side ✅ |

### **Important Notes:**
- ⚠️ **Security**: Admin secrets will be visible client-side due to `NEXT_PUBLIC_` prefix
- 🔄 **Fallback**: App automatically falls back to localStorage if database is unavailable
- 🌐 **CORS**: Ensure your Nhost project allows your Vercel domain
- 📱 **Mobile**: App is fully responsive and works on all devices

## 🎯 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Application loads successfully
- [ ] Authentication works
- [ ] Cards can be created and moved
- [ ] Columns can be reordered
- [ ] Real-time sync functional
- [ ] Connection status indicator shows green

## 🐛 Troubleshooting

### App shows "Using Mock Data"
- Check if `NEXT_PUBLIC_USE_MOCK_DATA` is set to `false`
- Verify all Nhost environment variables are correct
- Check Nhost project is active and accessible

### Authentication Issues
- Verify Nhost subdomain and region are correct
- Check CORS settings in Nhost dashboard
- Ensure Vercel domain is allowed in Nhost

### Real-time Sync Not Working
- Check GraphQL endpoint is accessible
- Verify admin secret is correct
- Check browser console for WebSocket/SSE errors

## 🚀 Live Demo
Once deployed, your Kanban board will be available at:
`https://kanban-board-[your-vercel-id].vercel.app`

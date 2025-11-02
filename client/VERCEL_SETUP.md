# Vercel Environment Variables Setup

## Current Issue
Your frontend is still connecting to `localhost:8000` instead of the production backend.

## Solution: Set Environment Variables in Vercel Dashboard

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Go to your project dashboard
3. Click on your frontend project

### Step 2: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add these variables:

**Variable 1:**
- Name: `VITE_API_URL`
- Value: `https://skillswap-h4b-b9s2.onrender.com/api`
- Environment: Production

**Variable 2:**
- Name: `VITE_SOCKET_URL`
- Value: `https://skillswap-h4b.onrender.com`
- Environment: Production

### Step 3: Redeploy
1. After adding the variables, trigger a new deployment
2. You can do this by pushing a new commit or clicking "Redeploy" in Vercel

## Alternative: Quick Test
If you want to test immediately, the code changes I made should automatically use the Render URLs when not running on localhost.

## Verification
After deployment, check the browser console for:
```
🔧 Socket Configuration: {
  hostname: "your-app.vercel.app",
  VITE_SOCKET_URL: "https://skillswap-h4b.onrender.com",
  SOCKET_URL: "https://skillswap-h4b.onrender.com",
  MODE: "production"
}
```

The SOCKET_URL should NOT be localhost anymore.

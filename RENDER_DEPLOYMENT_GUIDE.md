# Render Deployment Guide for Scribble.io

## Step 1: Prepare Your Code for Deployment

### 1.1 Update Frontend Socket Configuration
The frontend needs to know the backend URL. Update `frontend/src/socket.ts`:

**Change from:**
```typescript
const socket = io('http://localhost:3001');
```

**Change to:**
```typescript
const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(backendURL);
```

### 1.2 Create .env.example files

**Root directory (.env.example):**
```
# Backend configuration
PORT=3001
NODE_ENV=production
```

**frontend/.env.example:**
```
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

### 1.3 Create a render.yaml for deployment configuration

At the root of your repository, create `render.yaml`:

```yaml
services:
  - type: web
    name: scribble-io-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: PORT
        value: 3000
      - key: NODE_ENV
        value: production
    autoDeploy: true

  - type: static
    name: scribble-io-frontend
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    envVars:
      - key: VITE_BACKEND_URL
        generateValue: https://scribble-io-backend.onrender.com
    autoDeploy: true
```

---

## Step 2: Push Code to GitHub

1. **Initialize git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Scribble.io with new UI and footer"
   git branch -M main
   ```

2. **Create a GitHub repository** at https://github.com/new

3. **Add remote and push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/scribble-io.git
   git push -u origin main
   ```

---

## Step 3: Deploy on Render

### 3.1 Deploy Backend Service

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. **Connect your GitHub repository**:
   - Click "Connect account" and authorize GitHub
   - Select your `scribble-io` repository
4. **Configure the service**:
   - **Name**: `scribble-io-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free` (for testing) or `Starter` (recommended)
5. **Add Environment Variables** (Advanced):
   - `PORT`: Leave empty (Render assigns automatically)
   - `NODE_ENV`: `production`
6. Click **"Create Web Service"**
7. **Wait for deployment** (takes 2-5 minutes)
8. **Copy the URL** (e.g., `https://scribble-io-backend.onrender.com`)

### 3.2 Deploy Frontend Service

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. **Connect your GitHub repository** (if not already connected)
3. **Configure the service**:
   - **Name**: `scribble-io-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. **Add Environment Variables**:
   - `VITE_BACKEND_URL`: Paste your backend URL from Step 3.1 (e.g., `https://scribble-io-backend.onrender.com`)
5. Click **"Create Static Site"**
6. **Wait for deployment** (takes 2-5 minutes)
7. **Your frontend URL** will be displayed (e.g., `https://scribble-io.onrender.com`)

---

## Step 4: Update Backend CORS Configuration (if needed)

Update `backend/server.js` to allow your frontend domain:

```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});
```

Then add to Render backend environment variables:
- `FRONTEND_URL`: Your frontend Render URL

---

## Step 5: Verify Deployment

1. **Visit your frontend URL** in a browser
2. **Try creating a room** - you should be able to connect to the backend
3. **Test gameplay** - open multiple browser tabs to test multiplayer
4. **Check logs** in Render dashboard if there are issues

---

## Step 6: Configure Custom Domain (Optional)

1. In Render dashboard, go to your frontend service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain (requires DNS configuration)
4. Follow Render's DNS instructions

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend can't connect to backend | Check `VITE_BACKEND_URL` env variable and ensure backend URL is correct |
| "CORS error" | Update backend `cors` origin to include your frontend domain |
| Build fails | Check `npm install` works locally; verify package.json scripts |
| Static site shows blank page | Ensure `frontend/dist` folder is generated; check build logs |
| Free tier keeps sleeping | Upgrade to Starter plan ($7/month) or use Render Cron Jobs to ping |

---

## Step 7: Enable Persistent Services (Recommended)

For better uptime on free tier:
- Upgrade **backend** to **Starter** plan ($7/month)
- Keep **frontend** on free static hosting

Or keep both free and use cron jobs to ping the backend periodically.

---

## Summary of Deployment

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| Backend | Render Web Service | `https://scribble-io-backend.onrender.com` |
| Frontend | Render Static Site | `https://scribble-io.onrender.com` |

Your app will be live and accessible to everyone! 🎉

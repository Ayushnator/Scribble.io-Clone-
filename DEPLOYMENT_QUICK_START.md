# Quick Deployment Steps for Render

## 1️⃣ Push Code to GitHub

```bash
git init
git add .
git commit -m "Prepare for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scribble-io.git
git push -u origin main
```

---

## 2️⃣ Deploy Backend on Render

1. Go to https://render.com (Sign up if needed)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `scribble-io-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Select `Free` or `Starter`
5. Click **"Create Web Service"**
6. **Wait 2-5 minutes for deployment**
7. **Copy the backend URL** (e.g., `https://scribble-io-backend.onrender.com`)

---

## 3️⃣ Deploy Frontend on Render

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Select your GitHub repository
3. Fill in:
   - **Name**: `scribble-io-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Click **"Advanced"** and add Environment Variable:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: Paste your backend URL from Step 2
5. Click **"Create Static Site"**
6. **Wait 2-5 minutes for deployment**
7. **Your app is now live!** 🎉

---

## 4️⃣ Test Your Deployment

1. Open your frontend URL in a browser
2. Enter a username and select an avatar
3. Click **"Play Now"**
4. Open another browser tab/window with the same URL
5. Join the room with the room code
6. Test drawing and guessing!

---

## 🔧 Environment Variables Used

### Backend (Render Web Service)
- `NODE_ENV` = `production` (auto-set)
- `PORT` = auto-assigned by Render

### Frontend (Render Static Site)
- `VITE_BACKEND_URL` = your backend URL

---

## ⚠️ If Something Goes Wrong

### Backend not connecting
- Check **Render Backend Logs** in Dashboard
- Verify backend URL in frontend environment variable is correct
- Make sure backend is in "Running" state

### Frontend build fails
- Check build logs in Render
- Ensure `npm run build` works locally
- Check for TypeScript errors

### CORS errors
- Backend CORS is configured to accept all origins
- Should work automatically

### Services keep sleeping (Free tier)
- Upgrade to Starter ($7/month) for persistent services
- Or keep free and they'll wake up on first request (5-10s delay)

---

## 📊 Cost Breakdown

- **Free Static Site** (Frontend): $0/month
- **Free Web Service** (Backend): $0/month but may sleep
- **Starter Web Service** (Backend): $7/month for always-on

**Recommended**: Free frontend + Starter backend = $7/month

---

## 🚀 Next Steps

1. Share your deployment URL with friends!
2. Monitor logs in Render dashboard
3. Consider upgrading backend to Starter if using frequently
4. Add your own domain (optional)

**Congratulations! Your app is live!** 🎊

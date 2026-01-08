# Deployment Guide - Skigebiete-Finder v1.3

## Architecture

- **Frontend**: GitHub Pages (`https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/`)
- **Backend**: Render.com (Node.js service)

## Prerequisites

1. GitHub account with repository access
2. Render.com account (free tier)
3. OpenRouteService API key

---

## Step 1: Setup Database (Supabase)

1.  **Create Project**: Go to [Supabase](https://supabase.com), start a new project.
2.  **Get Credentials**: Go to `Settings` -> `API`. specific copy:
    *   Project URL
    *   `anon` public key
3.  **Initialize Schema**:
    *   Copy content from `backend/schema.sql`.
    *   Go to Supabase `SQL Editor`.
    *   Paste and Run to create tables.

### 1.2 Enable Security (RLS)
The included `schema.sql` also contains Security Policies.
1.  **Row Level Security (RLS)** is enabled on all tables.
2.  **Policies** are created to allow "Public Read" access for the frontend.
3.  **Backend** writes using the `SUPABASE_ADMIN_KEY` (Service Role), bypassing RLS.

---

## Step 2: Deploy Backend to Render

### 1.1 Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub

### 1.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `skigebiete-muenchen`
3. Configure:
   - **Name**: `skigebiete-backend`
   - **Region**: Frankfurt (closest to Germany)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.js`
   - **Plan**: Free

### 1.3 Set Environment Variables
In Render dashboard, add:
- `NODE_ENV` = `production`
- `ORS_API_KEY` = `your_actual_key_here`
- `SUPABASE_URL` = `https://your-project.supabase.co`
- `SUPABASE_KEY` = `your-anon-key` (Public/Anon)
- `SUPABASE_ADMIN_KEY` = `your-service-role-key` (Secret - Required for Writing Data)
- `ADMIN_USER` = `your_admin_username` (for Admin Dashboard)
- `ADMIN_PASS` = `your_secure_password_min_16_chars` (for Admin Dashboard)

**⚠️ Security Note**: Never use default credentials (`admin` / `skigebiete2026`) in production!

### 1.4 Deploy
Click "Create Web Service". Render will:
- Build your app
- Deploy it
- Give you a URL like: `https://skigebiete-backend-xyz.onrender.com`

**⚠️ Important**: Copy this URL!

---

## Step 2: Update Frontend Configuration

### 2.1 Update API URL
Edit `js/config.js`:
```javascript
export const API_BASE_URL = isLocalhost 
    ? 'http://localhost:10000/api'
    : 'https://YOUR_RENDER_URL.onrender.com/api';  // Replace with your actual Render URL
```

### 2.2 Commit Changes
```bash
git add js/config.js
git commit -m "Update production API URL"
git push origin main
```

---

## Step 3: Deploy Frontend to GitHub Pages

### 3.1 Enable GitHub Pages
1. Go to your repository on GitHub
2. Settings → Pages
3. Source: Deploy from branch `main`
4. Folder: `/ (root)`
5. Save

### 3.2 Wait for Deployment
GitHub will automatically deploy. Check:
`https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/`

---

## Step 4: Verify Production

1. **Backend Health Check**:
   ```
   https://YOUR_RENDER_URL.onrender.com/health
   ```
   Should return: `{"status":"ok","version":"1.0.0",...}`

2. **Frontend**:
   Open `https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/`
   - Should load resort data
   - Traffic features should work

---

## Local Development

```bash
# Backend
cd backend
npm start

# Frontend
# Open index.html in browser or use Live Server
```

The app auto-detects localhost and uses local backend.

---

## Troubleshooting

### CORS Errors
Backend already configured for GitHub Pages origin. If issues persist, check `backend/index.js` CORS settings.

### Render Free Tier Sleep
Free tier sleeps after 15min inactivity. First request may take 30s to wake up.

### ORS Rate Limits
- 2,000 requests/day
- Rate limiting: 5 traffic calculations per 15min per IP

---

## Admin Dashboard

The admin dashboard is protected with HTTP Basic Authentication and provides real-time monitoring and management capabilities.

**Dashboard URL**: `https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/admin/dashboard.html`

### Authentication Setup

> [!IMPORTANT]
> **Required**: `ADMIN_USER` and `ADMIN_PASS` must be set as environment variables.

#### Local Development

1. Create or edit `backend/.env` file:
   ```
   ADMIN_USER=your_username
   ADMIN_PASS=your_secure_password
   ```

2. Restart the backend server

#### Production (Render.com)

1. Go to Render.com → Your Service → Environment
2. Set `ADMIN_USER` and `ADMIN_PASS` environment variables
3. Use a strong password (minimum 16 characters)
4. Click "Save Changes" to redeploy

**Password Requirements**:
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, and symbols
- No dictionary words
- Unique to this application

### Dashboard Features

- **API Usage Monitor**: Daily request count and 30-day trend chart
- **Webcam Monitor**: Health tracking of all resort webcam links
- **Parser Status**: Live monitoring of all ski resort data scrapers
- **System & Cache**: Cache statistics and management (clear parsers, weather, traffic)
- **Server Logs**: Real-time log viewer with error filtering

### Troubleshooting

#### 401 Unauthorized Error

**Cause**: Incorrect credentials or credentials not set.

**Solution**:
1. Verify `ADMIN_USER` and `ADMIN_PASS` are set in Render.com
2. Check for typos in username/password
3. Ensure backend has redeployed after changing environment variables

#### Dashboard Loads But Shows No Data

**Cause**: Backend is sleeping (Render free tier) or CORS issues.

**Solution**:
1. Wait 30-60 seconds for Render to wake up the backend
2. Refresh the dashboard
3. Check browser DevTools console for errors

### Security Best Practices

1. **Use Strong Credentials**: Always use strong, unique passwords
2. **HTTPS Only**: Backend on Render.com automatically uses HTTPS
3. **Rotate Credentials**: Change admin password every 3-6 months
4. **Monitor Access**: Review server logs for unauthorized access attempts
5. **Limit Access**: Only share credentials with trusted team members
6. **Password Manager**: Store credentials securely in a password manager

For API endpoint details, see [docs/API.md](docs/API.md#-admin-endpoints).

---

## Monitoring

- **Render Logs**: Dashboard → Logs
- **GitHub Pages**: Settings → Pages (deployment status)
- **Admin Dashboard**: `https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/admin/dashboard.html`

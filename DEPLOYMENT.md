# Know-Map — Deployment Guide

> Stack: React + Vite → **Vercel** | Express → **Render** | **MongoDB Atlas**

---

## 1. MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Database Access** → Add a database user with password auth
3. **Network Access** → Add `0.0.0.0/0` (allow all IPs — needed for Render)
4. **Connect** → Drivers → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster.mongodb.net/knowmap?retryWrites=true&w=majority
   ```
   Save this as `MONGO_URI`.

---

## 2. Deploy Backend to Render

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo, set **Root directory** to `server/`
4. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node index.js`
   - **Node version:** 18+
5. Add **Environment Variables** in the Render dashboard:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | a random 32+ character string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | your Vercel URL (set after step 3) |
   | `GOOGLE_CLIENT_ID` | your Google OAuth client ID |

6. Deploy — note the Render URL e.g. `https://know-map-api.onrender.com`

---

## 3. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Set **Root directory** to `.` (project root)
3. Framework preset: **Vite**
4. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://know-map-api.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | your Google OAuth client ID |

5. Deploy — note your Vercel URL e.g. `https://know-map.vercel.app`
6. **Go back to Render** and update `CLIENT_URL` to your Vercel URL → redeploy

---

## 4. Google OAuth Setup

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials:

- **Authorized JavaScript origins** — add:
  - `http://localhost:5173` (development)
  - `https://know-map.vercel.app` (your Vercel URL)

- **Authorized redirect URIs** — add:
  - `https://know-map.vercel.app`

---

## 5. Create First Admin User

After deploying, register an account through the UI, then:

**Option A — MongoDB Atlas UI:**
1. Atlas → Browse Collections → `users`
2. Find your document → Edit → set `isAdmin: true`

**Option B — MongoDB Compass:**
```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { isAdmin: true, role: "admin" } }
)
```

**Option C — Atlas Shell:**
```js
use knowmap
db.users.updateOne({ email: "your@email.com" }, { $set: { isAdmin: true } })
```

Then **re-login** — a new JWT will be issued with `isAdmin: true`.

---

## 6. Verify Deployment

```bash
# Health check
curl https://know-map-api.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}

# CORS check
curl -I -X OPTIONS https://know-map-api.onrender.com/api/health \
  -H "Origin: https://know-map.vercel.app"
# Expected: Access-Control-Allow-Origin: https://know-map.vercel.app
```

---

## Local Development

```bash
# Install all dependencies
npm run install:all

# Start both client (port 5173) and server (port 5001) together
npm run dev
```

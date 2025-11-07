# Deployment Guide - Personal Finance Tracker

## Backend Architecture

Your app uses **Supabase** as the backend - a serverless PostgreSQL database with built-in authentication, real-time subscriptions, and RESTful API.

### Backend Files

```
src/lib/
├── supabase.ts                    # Supabase client configuration
├── auth-service.ts                # Authentication operations
├── auth-context.tsx               # Auth state management
├── backend-service.ts             # Database operations (CRUD)
├── transaction-context.tsx        # Transaction state management
├── data-context.tsx               # Categories/Payment methods state
├── currency-context.tsx           # Currency preferences
├── queue-manager.ts               # Offline queue management
└── sync-service.ts                # Offline sync operations
```

### Database (Supabase)

Your database is already hosted on Supabase:
- **URL**: `https://qioipnpbecxnmmlymxet.supabase.co`
- **Tables**: transactions, categories, payment_methods, user_profiles
- **Auth**: Managed by Supabase Auth
- **RLS**: Row Level Security enabled for data isolation

## Recommended Hosting Options

### 🏆 Option 1: Vercel (Recommended - Free Tier Available)

**Best for**: React/Vite apps, automatic deployments, free SSL

#### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/finance-tracker.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository
   - Configure:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add Environment Variables:
     ```
     VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```
   - Click "Deploy"

3. **Custom Domain (Optional)**
   - Add your domain in Vercel settings
   - Update DNS records as instructed

**Pros:**
- ✅ Free tier (100GB bandwidth/month)
- ✅ Automatic deployments on git push
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Preview deployments for PRs

**Cons:**
- ❌ Limited to 100GB bandwidth on free tier

---

### Option 2: Netlify (Free Tier Available)

**Best for**: Static sites, easy setup, generous free tier

#### Steps:

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add Environment Variables in Site Settings
   - Click "Deploy"

3. **Configure Redirects**
   Create `public/_redirects`:
   ```
   /*    /index.html   200
   ```

**Pros:**
- ✅ Free tier (100GB bandwidth/month)
- ✅ Easy setup
- ✅ Free SSL
- ✅ Form handling
- ✅ Split testing

**Cons:**
- ❌ Slightly slower build times than Vercel

---

### Option 3: GitHub Pages (Free)

**Best for**: Simple hosting, no build limits

#### Steps:

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/finance-tracker",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Update vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/finance-tracker/',
     // ... rest of config
   });
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: gh-pages branch
   - Save

**Pros:**
- ✅ Completely free
- ✅ Unlimited bandwidth
- ✅ Simple setup

**Cons:**
- ❌ No automatic deployments
- ❌ Must be public repository (or GitHub Pro)
- ❌ No server-side features

---

### Option 4: Cloudflare Pages (Free)

**Best for**: Fast global CDN, unlimited bandwidth

#### Steps:

1. **Push to GitHub**

2. **Deploy to Cloudflare Pages**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Click "Create a project"
   - Connect GitHub
   - Configure:
     - Build command: `npm run build`
     - Build output: `dist`
   - Add Environment Variables
   - Deploy

**Pros:**
- ✅ Unlimited bandwidth (free)
- ✅ Fast global CDN
- ✅ Free SSL
- ✅ Automatic deployments

**Cons:**
- ❌ Slightly more complex setup

---

### Option 5: Railway (Paid - $5/month)

**Best for**: Full-stack apps, need server-side features

#### Steps:

1. **Push to GitHub**

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select repository
   - Add Environment Variables
   - Deploy

**Pros:**
- ✅ Can run backend services
- ✅ Database hosting
- ✅ Easy scaling

**Cons:**
- ❌ Not free ($5/month minimum)

---

## Comparison Table

| Feature | Vercel | Netlify | GitHub Pages | Cloudflare | Railway |
|---------|--------|---------|--------------|------------|---------|
| **Price** | Free | Free | Free | Free | $5/mo |
| **Bandwidth** | 100GB | 100GB | Unlimited | Unlimited | 100GB |
| **Build Minutes** | 6000/mo | 300/mo | Unlimited | 500/mo | 500/mo |
| **SSL** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom Domain** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Auto Deploy** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Preview Deploys** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Best For** | React/Vite | Static Sites | Simple | Global CDN | Full-stack |

---

## My Recommendation

### For Your App: **Vercel** 🏆

**Why:**
1. **Perfect for Vite/React** - Zero configuration needed
2. **Free tier is generous** - 100GB bandwidth is plenty for personal use
3. **Automatic deployments** - Push to GitHub, auto-deploys
4. **Fast global CDN** - Users worldwide get fast load times
5. **Preview deployments** - Test changes before going live
6. **Easy environment variables** - Secure credential management

### Deployment Steps (Vercel):

```bash
# 1. Install Vercel CLI (optional)
npm i -g vercel

# 2. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/finance-tracker.git
git push -u origin main

# 3. Deploy via Vercel Dashboard
# - Go to vercel.com
# - Import GitHub repo
# - Add environment variables
# - Deploy!

# OR use CLI
vercel
```

---

## Environment Variables to Set

Regardless of hosting platform, set these:

```env
VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security Note**: The anon key is safe to expose publicly - Supabase RLS policies protect your data.

---

## Post-Deployment Checklist

- [ ] Test signup/login
- [ ] Test creating transactions
- [ ] Test creating custom categories
- [ ] Test offline mode
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Enable analytics (optional)
- [ ] Set up error monitoring (optional - Sentry)

---

## Monitoring & Analytics (Optional)

### Vercel Analytics (Free)
- Built-in, just enable in dashboard
- Shows page views, performance

### Google Analytics
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

### Sentry (Error Tracking)
```bash
npm install @sentry/react
```

---

## Scaling Considerations

Your current setup can handle:
- **Users**: 10,000+ (Supabase free tier: 500MB database)
- **Requests**: Unlimited (Supabase free tier: 50,000 monthly active users)
- **Storage**: 1GB (Supabase free tier)

If you exceed free tier:
- Supabase Pro: $25/month (8GB database, 100,000 MAU)
- Vercel Pro: $20/month (1TB bandwidth)

---

## Backup Strategy

Your data is in Supabase:
1. **Automatic backups** - Supabase backs up daily
2. **Manual export** - Use Supabase dashboard to export SQL
3. **Point-in-time recovery** - Available on Pro plan

---

## Support & Maintenance

- **Supabase Status**: [status.supabase.com](https://status.supabase.com)
- **Vercel Status**: [vercel-status.com](https://vercel-status.com)
- **Updates**: `npm update` to update dependencies

---

## Cost Estimate (Monthly)

**Free Tier (Recommended for personal use):**
- Supabase: $0 (up to 500MB database)
- Vercel: $0 (up to 100GB bandwidth)
- **Total: $0/month** ✅

**If you need more:**
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- **Total: $45/month**

For a personal finance tracker with a few users, **free tier is more than enough**!

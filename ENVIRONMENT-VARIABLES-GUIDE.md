# Environment Variables Guide

## Overview

You have **two separate applications** in your project, each with its own environment variables:

```
expensetracker/
├── .env                    # Frontend environment variables
├── src/                    # Frontend React app
├── package.json            # Frontend dependencies
│
└── backend/
    ├── .env.example        # Backend environment template
    ├── .env.local          # Backend environment (you need to create this)
    ├── app/                # Backend Next.js API
    └── package.json        # Backend dependencies
```

---

## 1. Frontend Environment (`.env`)

**Location**: `/Users/siddeshwar/Desktop/Projects/expensetracker/.env`

**Purpose**: Configuration for your **React frontend** (Vite app)

**Current Content**:
```env
VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ACCESS_KEY=siddeshwar10
```

**What These Do**:
- `VITE_SUPABASE_URL` - Your Supabase project URL (frontend connects here)
- `VITE_SUPABASE_ANON_KEY` - Public key for Supabase (safe to expose in browser)
- `VITE_ACCESS_KEY` - Your custom access key

**Used By**: 
- `src/lib/supabase.ts` - Creates Supabase client
- `src/lib/auth-service.ts` - Authentication
- `src/lib/backend-service.ts` - Database operations

**Note**: `VITE_` prefix is required for Vite to expose these to the browser.

---

## 2. Backend Environment (`.env.example`)

**Location**: `/Users/siddeshwar/Desktop/Projects/expensetracker/backend/.env.example`

**Purpose**: **Template** for backend environment variables (not used directly)

**What You Need to Do**: Create `backend/.env.local` from this template

**Current Template**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # ⚠️ SECRET!
API_SECRET_KEY=generate_a_random_secret_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8082
PORT=4000
NODE_ENV=development
```

**What These Do**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (same as frontend)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (same as frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - **SECRET** admin key (bypasses RLS)
- `API_SECRET_KEY` - Secret for API security
- `ALLOWED_ORIGINS` - Which frontends can call this API
- `PORT` - Backend server port (4000)

**Used By**:
- `backend/lib/supabase.ts` - Creates admin Supabase client
- `backend/lib/auth.ts` - Verifies JWT tokens
- `backend/app/api/*` - All API routes

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│                                                         │
│  Uses: .env                                            │
│  ├─ VITE_SUPABASE_URL                                 │
│  ├─ VITE_SUPABASE_ANON_KEY                            │
│  └─ VITE_ACCESS_KEY                                   │
│                                                         │
│  Runs on: http://localhost:8082                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Can connect to:
                 │
    ┌────────────┴─────────────┐
    │                          │
    ▼                          ▼
┌─────────────────┐    ┌──────────────────────────────┐
│   SUPABASE      │    │   BACKEND API (Next.js)     │
│   (Database)    │    │                              │
│                 │    │  Uses: backend/.env.local    │
│  Direct access  │    │  ├─ SUPABASE_SERVICE_KEY    │
│  via anon key   │    │  ├─ API_SECRET_KEY          │
│                 │    │  └─ ALLOWED_ORIGINS         │
│                 │    │                              │
│                 │    │  Runs on: http://localhost:4000│
└─────────────────┘    └──────────────────────────────┘
```

---

## Current Setup (Direct Supabase)

**Right now**, your frontend connects **directly** to Supabase:

```
Frontend (.env) → Supabase Database
```

**Pros**:
- ✅ Simple setup
- ✅ Fast (no extra hop)
- ✅ Works great for personal use

**Cons**:
- ⚠️ Can't use service role key (would expose it)
- ⚠️ Limited server-side validation

---

## With Backend API (Optional)

**If you use the backend**, the flow becomes:

```
Frontend (.env) → Backend API (backend/.env.local) → Supabase
```

**Pros**:
- ✅ Service role key hidden on server
- ✅ Server-side validation
- ✅ Better security
- ✅ Rate limiting possible

**Cons**:
- ⚠️ More complex setup
- ⚠️ Slightly slower (extra hop)

---

## Setup Instructions

### Current Setup (Direct Supabase) - Already Working ✅

Your frontend `.env` is already configured:
```env
VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**No changes needed!** Your app works as-is.

---

### Optional: Add Backend API

If you want to use the backend API for extra security:

#### Step 1: Create Backend Environment File

Create `backend/.env.local`:

```bash
# Copy the template
cp backend/.env.example backend/.env.local
```

#### Step 2: Fill in the Values

Edit `backend/.env.local`:

```env
# Same as frontend
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get this from Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpb2lwbnBiZWN4bm1tbHlteGV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAxMzk1NywiZXhwIjoyMDc3NTg5OTU3fQ.YOUR_SERVICE_KEY_HERE

# Generate a random string
API_SECRET_KEY=your_random_secret_key_here

# Your frontend URLs
ALLOWED_ORIGINS=http://localhost:8082,http://localhost:5173

PORT=4000
NODE_ENV=development
```

#### Step 3: Update Frontend to Use Backend

Add to frontend `.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Then update `src/lib/backend-service.ts` to use the API (see BACKEND-INTEGRATION-GUIDE.md).

---

## Security Comparison

### Frontend `.env` (Current)
```env
VITE_SUPABASE_URL=...        # ✅ Safe to expose (public)
VITE_SUPABASE_ANON_KEY=...   # ✅ Safe to expose (public)
VITE_ACCESS_KEY=...          # ⚠️ Custom key (your choice)
```

**All these are visible in browser** - that's okay! Supabase RLS protects your data.

### Backend `.env.local` (Optional)
```env
SUPABASE_SERVICE_ROLE_KEY=...  # ⚠️ NEVER expose! Server only!
API_SECRET_KEY=...             # ⚠️ NEVER expose! Server only!
```

**These stay on server** - never sent to browser.

---

## Which Keys Are Safe to Share?

| Key | Safe to Expose? | Why |
|-----|----------------|-----|
| `VITE_SUPABASE_URL` | ✅ Yes | Public URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Public key, RLS protects data |
| `VITE_ACCESS_KEY` | ⚠️ Your choice | Custom key, depends on usage |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ NO! | Bypasses all security! |
| `API_SECRET_KEY` | ❌ NO! | Server authentication |

---

## Git Security

Both environment files should be in `.gitignore`:

```gitignore
# Frontend
.env
.env.local

# Backend
backend/.env
backend/.env.local
backend/.env*.local
```

**Never commit**:
- ❌ `.env` (frontend)
- ❌ `backend/.env.local` (backend)

**Safe to commit**:
- ✅ `backend/.env.example` (template only)

---

## Quick Reference

### Frontend Environment
- **File**: `.env`
- **Purpose**: Frontend configuration
- **Prefix**: `VITE_` (required)
- **Exposed**: Yes (in browser)
- **Used by**: React app

### Backend Environment
- **File**: `backend/.env.local` (you create this)
- **Template**: `backend/.env.example`
- **Purpose**: Backend API configuration
- **Prefix**: None needed
- **Exposed**: No (server only)
- **Used by**: Next.js API

---

## Recommendation

### For Personal Use (Current Setup):
✅ **Keep using direct Supabase** (frontend `.env` only)
- Simple
- Fast
- Secure enough with RLS

### For Production/Public:
✅ **Add backend API** (both `.env` files)
- Maximum security
- Service key hidden
- Server-side validation

---

## Summary

1. **Frontend `.env`** - Already configured ✅
   - Used by React app
   - Connects to Supabase
   - Working now!

2. **Backend `.env.local`** - Optional
   - Template: `backend/.env.example`
   - You need to create it
   - Only needed if using backend API

**Current Status**: Your app works with just frontend `.env`! Backend is optional for extra security.

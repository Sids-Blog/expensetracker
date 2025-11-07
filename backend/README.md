# Finance Tracker Backend API

Next.js API backend with enhanced security for the Personal Finance Tracker.

## Features

- ✅ **Server-side validation** using Zod
- ✅ **JWT authentication** verification
- ✅ **Service role key** kept secret on server
- ✅ **User ownership** verification
- ✅ **Admin-only routes** protection
- ✅ **CORS** configuration
- ✅ **Rate limiting** ready
- ✅ **Type-safe** with TypeScript

## Architecture

```
Frontend (React) → Backend API (Next.js) → Supabase Database
                    ↓
                 Validates
                 Authenticates
                 Authorizes
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_SECRET_KEY=generate_random_secret
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8082
```

**Get Service Role Key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (keep this secret!)

### 3. Run Development Server

```bash
npm run dev
```

API runs on: `http://localhost:3001`

## API Endpoints

### Authentication Required

All endpoints require `Authorization: Bearer <token>` header.

### Transactions

```
GET    /api/transactions          # Get user's transactions
POST   /api/transactions          # Create transaction
GET    /api/transactions/[id]     # Get single transaction
PATCH  /api/transactions/[id]     # Update transaction
DELETE /api/transactions/[id]     # Delete transaction
```

### Categories

```
GET    /api/categories            # Get user's categories
POST   /api/categories            # Create custom category
```

### Payment Methods

```
GET    /api/payment-methods       # Get user's payment methods
POST   /api/payment-methods       # Create custom payment method
```

### Admin Routes (Admin Only)

```
GET    /api/admin/users                      # Get all users
POST   /api/admin/users/[id]/activate        # Activate user
POST   /api/admin/users/[id]/deactivate      # Deactivate user
```

## Security Features

### 1. Server-Side Validation

```typescript
// All inputs validated with Zod
const createTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['expense', 'income']),
  amount: z.number().positive(),
  // ...
});
```

### 2. JWT Verification

```typescript
// Every request verifies JWT token
const user = await verifyAuth(request);
if (!user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3. Ownership Verification

```typescript
// Users can only access their own data
const { data } = await supabaseAdmin
  .from('transactions')
  .select('*')
  .eq('user_id', user.id);  // ← Enforced on server
```

### 4. Admin Protection

```typescript
// Admin routes check admin status
export const GET = requireAdmin(async (request, user) => {
  // Only admins can access this
});
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Add backend"
git push
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import repository
3. Select `backend` folder as root directory
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!
   - `ALLOWED_ORIGINS` (your frontend URL)
5. Deploy!

### 3. Update Frontend

Update frontend to use backend API:

```typescript
// src/lib/backend-service.ts
const API_URL = 'https://your-backend.vercel.app/api';

static async getTransactions() {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `API_SECRET_KEY` | Random secret for API | Yes |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs | Yes |

## Testing

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test with auth
curl http://localhost:3001/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Benefits Over Direct Supabase

| Feature | Direct Supabase | With Backend API |
|---------|----------------|------------------|
| **Service Key** | Exposed in frontend | Hidden on server ✅ |
| **Validation** | Client-side only | Server-side ✅ |
| **Rate Limiting** | Limited control | Full control ✅ |
| **Custom Logic** | Edge functions | Native Next.js ✅ |
| **Logging** | Basic | Advanced ✅ |
| **Caching** | Limited | Full control ✅ |

## Cost

- **Vercel**: Free tier (100GB bandwidth)
- **Next.js**: Serverless functions (free tier: 100GB-hours)
- **Total**: $0/month for personal use ✅

## Monitoring

Add monitoring in production:

```typescript
// lib/monitoring.ts
export function logRequest(user: string, endpoint: string) {
  console.log(`[${new Date().toISOString()}] ${user} → ${endpoint}`);
}
```

## Rate Limiting (Optional)

Add rate limiting with Upstash:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

## Support

- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)

# Test Backend Connection

## Quick Test

### 1. Check Backend is Running

```bash
curl http://localhost:4000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### 2. Test with Authentication

Open browser console (F12) and run:

```javascript
// Test API connection
fetch('http://localhost:4000/api/health')
  .then(r => r.json())
  .then(console.log);
```

### 3. Check Frontend is Using Backend

1. Open your app: http://localhost:8082
2. Open DevTools (F12) → Network tab
3. Filter by "categories"
4. Try to create a category
5. You should see a request to: `http://localhost:4000/api/categories`

### 4. Check Backend Logs

In the terminal where backend is running, you should see:

```
Creating/opting into category: { user_id: '...', name: 'Food', type: 'expense' }
Category result: [...]
```

## If You Don't See Logs:

### Issue: Frontend not calling backend

**Check**: Is `VITE_API_URL` set in `.env`?

```env
VITE_API_URL=http://localhost:4000/api
```

**Fix**: Add it and restart frontend

### Issue: CORS error

**Symptom**: Browser console shows CORS error

**Fix**: Check `backend/.env.local`:

```env
ALLOWED_ORIGINS=http://localhost:8082,http://localhost:5173
```

### Issue: 401 Unauthorized

**Symptom**: API returns 401

**Fix**: Make sure you're logged in. JWT token must be sent in Authorization header.

## Debug Steps

### 1. Check Environment Variables

**Frontend `.env`:**
```bash
cat .env | grep API_URL
# Should show: VITE_API_URL=http://localhost:4000/api
```

**Backend `.env.local`:**
```bash
cat backend/.env.local | grep SUPABASE_SERVICE_ROLE_KEY
# Should show your service role key
```

### 2. Check Backend Logs

```bash
# Backend terminal should show:
✓ Ready in 1315ms
```

### 3. Test API Directly

```bash
# Get your JWT token from browser (Application → Local Storage → supabase.auth.token)
# Then test:

curl -X GET http://localhost:4000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Check Network Requests

In browser DevTools → Network:
- Filter: "categories"
- Look for: `http://localhost:4000/api/categories`
- Check: Request Headers should have `Authorization: Bearer ...`

## Expected Flow

```
1. User creates category "Food"
   ↓
2. Frontend calls: POST http://localhost:4000/api/categories
   ↓
3. Backend logs: "Creating/opting into category: { name: 'Food', ... }"
   ↓
4. Backend calls Supabase function: create_or_opt_in_category
   ↓
5. Backend logs: "Category result: [{ id: '...', name: 'Food', is_new: true }]"
   ↓
6. Frontend receives response
   ↓
7. Category appears in list
```

## Common Issues

### No logs in backend terminal

**Cause**: Frontend not calling backend

**Check**:
1. Is backend running? (curl http://localhost:4000/api/health)
2. Is VITE_API_URL set in frontend .env?
3. Did you restart frontend after adding VITE_API_URL?

### Backend logs show error

**Cause**: SQL functions not created

**Fix**: Run `fix-opt-in-system.sql` in Supabase

### Categories not persisting order

**Cause**: Order update not implemented yet

**Fix**: The order is stored in `user_orders` JSONB field. Need to implement update endpoint.

## Quick Fixes

### Restart Everything

```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
npm run dev
```

### Clear Cache

```bash
# Clear browser cache
# Or open in incognito mode
```

### Check Ports

```bash
# Backend should be on 4000
lsof -ti:4000

# Frontend should be on 8082
lsof -ti:8082
```

## Success Indicators

✅ Backend shows logs when creating categories
✅ Network tab shows requests to localhost:4000
✅ Categories persist after refresh
✅ Multiple users can share categories
✅ Order is maintained (once implemented)

## Still Not Working?

1. Check all environment variables
2. Restart both frontend and backend
3. Clear browser cache
4. Check browser console for errors
5. Check backend terminal for errors
6. Verify SQL functions exist in Supabase

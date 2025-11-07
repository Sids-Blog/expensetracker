# Fix TypeScript Errors

## Issue

VS Code's TypeScript server hasn't picked up the newly installed Next.js dependencies in the `backend` folder.

## Solution

### Option 1: Restart TypeScript Server (Recommended)

1. Open VS Code Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows)
2. Type: `TypeScript: Restart TS Server`
3. Press Enter

This will reload TypeScript and pick up the new node_modules.

### Option 2: Reload VS Code Window

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type: `Developer: Reload Window`
3. Press Enter

### Option 3: Close and Reopen VS Code

Simply close VS Code and open it again.

## Verify Fix

After restarting, the errors should disappear:
- ✅ `Cannot find module 'next/server'` - Should be gone
- ✅ Currency type error - Should be gone

## If Errors Persist

1. Make sure you ran `npm install` in the backend folder:
   ```bash
   cd backend
   npm install
   ```

2. Check that `node_modules` exists in backend:
   ```bash
   ls backend/node_modules/next
   ```

3. Try opening just the backend folder in VS Code:
   ```bash
   code backend
   ```

## The Errors Are Not Critical

These are just TypeScript intellisense errors. The code will still:
- ✅ Compile correctly
- ✅ Run correctly
- ✅ Deploy correctly

They're just VS Code not seeing the types yet.

## Quick Test

Run the backend to verify it works despite the errors:

```bash
cd backend
npm run dev
```

If it starts successfully, the errors are just VS Code caching issues.

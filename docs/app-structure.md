# Application Structure

## Overview
Personal Finance Tracker with multi-user authentication and personalized data management.

## Pages

### 1. Home Page (/)
- Welcome screen with user greeting
- Single card to navigate to Expense Tracker
- Logout button in header

### 2. Expense Tracker (/expense)
Main application page with tabs:

#### Dashboard Tab
- Financial overview and analytics
- Income vs Expense charts
- Monthly summaries

#### Transactions Tab
- List of all user transactions
- Filter and search capabilities
- Edit/Delete transactions

#### Categories Tab
- Manage expense and income categories
- User sees default categories + their custom ones
- Add/Edit/Delete custom categories
- Reorder categories

#### Settings Tab
- Currency preferences
- Application settings
- Display preferences

#### Profile Tab
- Update full name
- Change password
- View account information
- View last login time

#### Users Tab (Admin Only)
- View all users
- Activate/Deactivate users
- Grant/Revoke admin privileges
- View user statistics
- Cannot modify own admin status

### 3. Authentication Pages
- **/login** - Sign in page
- **/signup** - New user registration
- **/forgot-password** - Password reset flow

## Data Isolation

### User-Specific Data
- **Transactions**: Each user only sees their own transactions
- **Custom Categories**: Users can create personal categories
- **Custom Payment Methods**: Users can create personal payment methods

### Shared Data
- **Default Categories**: Pre-defined categories visible to all users
- **Default Payment Methods**: Pre-defined payment methods visible to all users

## User Roles

### Regular User
- Access to all tabs except Users
- Can manage own transactions
- Can create custom categories/payment methods
- Can update own profile

### Admin User
- All regular user permissions
- Access to Users tab
- Can view all users
- Can activate/deactivate users
- Can grant/revoke admin privileges
- Cannot deactivate self or remove own admin status

## Key Features

1. **Multi-User Support**: Each user has isolated data
2. **Personalized Categories**: Users can create custom categories while still seeing defaults
3. **Personalized Payment Methods**: Users can create custom payment methods
4. **Profile Management**: Users can update their profile and password
5. **Admin Panel**: Admins can manage users from the Users tab
6. **Offline Support**: Transactions sync when back online
7. **Responsive Design**: Works on mobile and desktop

## Navigation Flow

```
Login/Signup → Home Page → Expense Tracker
                              ├─ Dashboard
                              ├─ Transactions
                              ├─ Categories (personalized)
                              ├─ Settings
                              ├─ Profile
                              └─ Users (admin only)
```

## Security

- Row Level Security (RLS) enforced at database level
- Users can only access their own data
- Admin functions require admin role
- Self-modification prevention for critical actions
- Secure password handling via Supabase Auth

## Environment Setup

Required environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

1. Run SQL migrations in Supabase
2. Set environment variables
3. Start the app: `npm run dev`
4. Sign up for an account
5. Make yourself admin via SQL:
   ```sql
   UPDATE user_profiles 
   SET is_admin = true 
   WHERE email = 'your-email@example.com';
   ```
6. Refresh and access all features

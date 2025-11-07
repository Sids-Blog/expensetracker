# Personal Finance Tracker

A modern, reusable personal finance tracking application built with React, TypeScript, Supabase, and shadcn/ui components. This application has been refactored to remove authentication and budget modules, making it more focused and reusable.

## Features

- **Expense & Income Tracking**: Add, edit, and delete financial transactions
- **Category Management**: Organize transactions with customizable categories
- **Payment Method Tracking**: Track different payment methods
- **Dashboard Analytics**: Visual charts and statistics for financial insights
- **Robust Backend Service**: Complete API layer with error handling and retry logic
- **Offline Support**: Works offline with automatic sync when online
- **Queue Management**: Automatic operation queueing and synchronization
- **Backend Monitoring**: Real-time backend health and sync status monitoring
- **Responsive Design**: Mobile-friendly interface
- **Reusable Components**: Modular architecture for easy customization

## Reusable Components

### UI Components

#### `CurrencyDisplay`
A reusable component for displaying currency amounts with proper formatting and icons.

```tsx
import { CurrencyDisplay } from "@/components/ui/currency-display";

<CurrencyDisplay 
  amount={100.50} 
  currency="USD" 
  showIcon={true} 
  className="text-lg font-bold" 
/>
```

#### `TransactionCard`
A card component for displaying transaction information with optional actions.

```tsx
import { TransactionCard } from "@/components/ui/transaction-card";

<TransactionCard
  transaction={transaction}
  onEdit={handleEdit}
  onDelete={handleDelete}
  showActions={true}
/>
```

#### `FormField`
A versatile form field component supporting various input types.

```tsx
import { FormField } from "@/components/ui/form-field";

<FormField
  type="select"
  label="Category"
  value={category}
  onChange={setCategory}
  options={categories.map(cat => ({ value: cat, label: cat }))}
  required
/>
```

#### `DropdownManager`
A component for managing lists of items with drag-and-drop reordering.

```tsx
import { DropdownManager } from "@/components/ui/dropdown-manager";

<DropdownManager
  title="Categories"
  description="Manage your expense categories"
  items={categories}
  onAdd={handleAdd}
  onRemove={handleRemove}
  onReorder={handleReorder}
/>
```

### Business Components

#### `ExpenseForm` & `IncomeForm`
Pre-built forms for adding expenses and income with validation.

#### `Dashboard`
Analytics dashboard with charts and financial summaries.

#### `TransactionList`
Comprehensive transaction listing with filtering, sorting, and export capabilities.

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal-finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:

See the [Database Setup Guide](docs/database-setup.md) for detailed instructions.

**Quick setup:**
- **New installation:** Run `supabase-schema.sql` in your Supabase SQL editor
- **Existing installation:** Run `supabase-migration.sql` (⚠️ backup your data first!)

5. Start the development server:
```bash
npm run dev
```

## Backend Service

The application includes a comprehensive backend service layer that provides:

### Core Features
- **API Abstraction**: Clean interface to Supabase database operations
- **Error Handling**: Standardized error responses and retry logic
- **Offline Support**: Automatic operation queueing when offline
- **Auto-Sync**: Automatic synchronization when connection is restored
- **Batch Operations**: Efficient bulk operations for better performance
- **Health Monitoring**: Real-time backend health checks and status monitoring

### Key Services

#### BackendService
Main API service handling all database operations with proper error handling.

#### QueueManager
Manages offline operations queue with automatic retry and failure handling.

#### SyncService
Handles synchronization between offline queue and backend with conflict resolution.

#### Enhanced Contexts
Improved React contexts with built-in offline support and automatic synchronization.

### Usage Example

```typescript
import { BackendService } from '@/lib/backend-service';

// All operations return standardized responses
const result = await BackendService.createTransaction({
  date: '2024-01-15',
  type: 'expense',
  amount: 50.00,
  currency: 'USD',
  category: 'Food'
});

if (result.success) {
  console.log('Transaction created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

For detailed API documentation, see [Backend API Documentation](docs/backend-api.md).

## Database Schema

The application uses the following main tables:
- `transactions`: Store expense and income records
- `categories`: Manage expense and income categories  
- `payment_methods`: Track different payment methods

## Customization

### Adding New Currency Support

1. Update the `Currency` type in `src/components/ui/currency-display.tsx`
2. Add the currency symbol and icon mappings
3. Update the currency list in `src/components/SettingsPage.tsx`

### Creating Custom Transaction Types

1. Extend the `Transaction` interface in `src/lib/supabase.ts`
2. Update form components to handle new fields
3. Modify the dashboard analytics as needed

### Styling Customization

The application uses Tailwind CSS with shadcn/ui components. Customize:
- Colors: Update `tailwind.config.ts`
- Components: Modify component files in `src/components/ui/`
- Themes: Add dark mode support via next-themes

## Architecture

```
src/
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── Dashboard.tsx            # Analytics dashboard
│   ├── ExpenseForm.tsx          # Expense entry form
│   ├── IncomeForm.tsx           # Income entry form
│   ├── TransactionList.tsx      # Transaction management
│   ├── SettingsPage.tsx         # Application settings
│   └── BackendStatus.tsx        # Backend monitoring component
├── lib/
│   ├── backend-service.ts       # Main API service layer
│   ├── queue-manager.ts         # Offline operations queue
│   ├── sync-service.ts          # Synchronization service
│   ├── enhanced-data-context.tsx        # Enhanced data management
│   ├── enhanced-transaction-context.tsx # Enhanced transaction management
│   ├── currency-context.tsx     # Currency state management
│   ├── data-context.tsx         # Legacy data context
│   ├── transaction-context.tsx  # Legacy transaction context
│   └── supabase.ts             # Database client
├── pages/
│   ├── Index.tsx               # Home page
│   ├── ExpensePage.tsx         # Expense management page
│   └── AdminPage.tsx           # Settings and configuration
├── hooks/
│   └── use-toast.ts            # Toast notifications
└── docs/
    └── backend-api.md          # Backend API documentation
```

## What was removed?

- **Authentication System**: Removed login/logout functionality and session management
- **Budget Module**: Removed budget tracking, allocation, and budget-specific pages
- **Access Control**: No more protected routes or user authentication
- **Session Management**: Removed active session tracking and management

## What was made reusable?

- **Currency Display**: Centralized currency formatting and display logic
- **Form Fields**: Generic form field component supporting multiple input types
- **Transaction Cards**: Reusable transaction display components
- **Dropdown Management**: Generic component for managing lists with drag-and-drop
- **Backend Service Layer**: Complete API abstraction with error handling
- **Queue Management**: Reusable offline operation queueing system
- **Sync Service**: Automatic synchronization with retry logic
- **Backend Monitoring**: Real-time status monitoring components
- **Enhanced Contexts**: Improved state management with offline support
- **Modular Architecture**: Clear separation of UI and business logic components

## Technologies Used

This project is built with:

- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript
- **React**: UI library with hooks and context
- **shadcn/ui**: Modern UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend-as-a-Service for database and real-time features
- **Recharts**: Charts and data visualization
- **React Router**: Client-side routing
- **DND Kit**: Drag and drop functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.
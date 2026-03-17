# Currency Settings Implementation

## Overview

A complete multi-currency system has been implemented using Intl.NumberFormat for proper localization of currency formatting across the application.

## Architecture

### 1. Database Schema
- **Table**: `organizations`
- **Column**: `currency` (VARCHAR(3), DEFAULT: 'TRY')
- **Type**: ISO 4217 currency codes

**Migration**: Execute the SQL migration to add the currency column to existing databases:
```sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TRY';
```

### 2. Utility Functions

**File**: `lib/utils/format.ts`

#### Core Functions:
- `formatCurrency(value, currency)` - Formats value as currency with symbol
- `formatNumber(value, currency)` - Formats number with locale formatting
- `formatPercentage(value, currency)` - Formats as percentage with locale
- `getLocaleForCurrency(currency)` - Returns appropriate locale for currency
- `formatCurrencyAmount(value, currency)` - Returns just the number part without symbol

#### Supported Currencies:
- TRY (Turkish Lira) - Default
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- BRL (Brazilian Real)
- INR (Indian Rupee)
- AUD (Australian Dollar)
- CAD (Canadian Dollar)
- CHF (Swiss Franc)
- CNY (Chinese Yuan)
- SEK (Swedish Krona)
- NZD (New Zealand Dollar)

#### Locale Mapping:
Each currency is mapped to an appropriate locale for proper formatting:
- TRY → tr-TR (Turkish)
- USD → en-US (English - US)
- EUR → de-DE (German)
- BRL → pt-BR (Portuguese - Brazil)
- etc.

### 3. Settings Component

**File**: `components/settings/CurrencySettings.tsx`

A client component that allows organization admins to select their preferred currency:
- Grid display of all supported currencies with flags
- Visual feedback for selected currency
- Save button that calls the server action
- Success/error messages

### 4. Server Action

**File**: `lib/actions/organization.actions.ts`

`updateOrganizationSettings(currency)` - Updates the organization's currency setting:
- Validates user authentication
- Verifies organization access
- Updates database via admin client
- Returns success/error response

### 5. Settings Page Integration

**File**: `app/dashboard/settings/page.tsx`

- Added import of `CurrencySettings` component
- Component displays at the end of settings page
- Passes `organizationId` and `currentCurrency` as props

## Usage Examples

### In Server Components:
```typescript
import { getOrganization } from '@/lib/auth/getOrganization'
import { formatCurrency } from '@/lib/utils/format'

export default async function Page() {
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'
  
  return <div>{formatCurrency(1000, currency)}</div>
  // Output: "1.000,00 ₺" (if Turkish) or "$1,000.00" (if USD)
}
```

### In Client Components:
```typescript
import { formatCurrency } from '@/lib/utils/format'

export function MyComponent({ currency = 'TRY' }) {
  const price = 100.50
  return <p>{formatCurrency(price, currency)}</p>
}
```

### Passing Currency to Props:
```typescript
// Server component
const organization = await getOrganization()
const currency = organization?.currency || 'TRY'
return <ClientComponent currency={currency} />

// Client component
interface Props {
  currency: string
}
export function ClientComponent({ currency }: Props) {
  return <p>{formatCurrency(100, currency)}</p>
}
```

## Updated Components

### Pages:
1. **Cash Register** (`/app/dashboard/cash-register/page.tsx`)
   - Fetches organization currency
   - Formats summary cards (Income, Expenses, Instructor Pay, Net Balance)
   - Formats transaction list amounts

2. **Instructor Earnings** (`/app/dashboard/instructor-earnings/page.tsx`)
   - Fetches organization currency
   - Formats total earnings summary
   - Formats individual earning amounts

3. **Packages** (`/app/dashboard/packages/page.tsx`)
   - Server wrapper fetches currency
   - Client component displays package prices
   - Creates wrapper architecture

4. **Student Detail** (`/app/dashboard/students/[id]/page.tsx`)
   - Fetches organization currency
   - Passes currency to StudentPurchaseDialog

### Components:
1. **StudentPurchaseDialog** (`components/students/StudentPurchaseDialog.tsx`)
   - Accepts `currency` prop
   - Formats package prices using formatCurrency

2. **CurrencySettings** (NEW - `components/settings/CurrencySettings.tsx`)
   - Grid display of currency options
   - Save functionality
   - Success/error feedback

## Implementation Pattern for New Components

When adding currency formatting to new components:

1. **If Server Component**:
   ```typescript
   import { getOrganization } from '@/lib/auth/getOrganization'
   
   export default async function MyPage() {
     const org = await getOrganization()
     const currency = org?.currency || 'TRY'
     // Use currency in formatting
   }
   ```

2. **If Client Component receiving props**:
   ```typescript
   interface Props {
     currency: string
   }
   export function MyComponent({ currency }: Props) {
     // Use currency parameter
   }
   ```

3. **If Client Component in client-only context**:
   - Create a server wrapper that fetches currency
   - Pass to client component as prop

## Testing Currency Formatting

To test different currencies:

1. Go to Settings → Currency Settings
2. Select a different currency (e.g., USD)
3. Save
4. Visit any page with currency displays (Cash Register, Packages, etc.)
5. Verify formatting matches selected currency:
   - USD: $1,000.00
   - TRY: 1.000,00 ₺
   - EUR: 1.000,00 €
   - etc.

## Notes

- Default currency is TRY (Turkish Lira) if not set
- All formatting respects the organization's locale
- Intl.NumberFormat provides proper decimal separator, thousands separator, and currency symbol
- Currency selection is per-organization
- Backward compatible with existing code (uses default if not specified)

## Future Enhancements

- Add currency conversion rates
- Support for custom currency symbols
- Historical currency rates for reporting
- Per-branch currency settings
- Bulk import of historical data with currency conversion

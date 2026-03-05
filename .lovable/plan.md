

# Escrow Service MVP — Implementation Plan

## 1. Supabase Database Setup

### Tables (via migrations, in order):
1. **`profiles`** — id, user_id (FK auth.users), display_name, email, created_at, updated_at
2. **`user_roles`** — id, user_id (FK auth.users), role (enum: buyer/seller/admin). Unique on (user_id, role). Security definer `has_role()` function for RLS.
3. **`transactions`** — buyer_id, seller_id (nullable), seller_email_invited, title, description, amount_cents, currency (ZAR), status (enum with all 12 statuses), delivery_terms, due_date, buyer_confirmed_at, released_at, timestamps
4. **`transaction_events`** — transaction_id, actor_profile_id, event_type, message, metadata (jsonb), created_at
5. **`payments`** — transaction_id, provider (simulated), method (card/eft/wallet), simulated_reference, payment_status (PENDING/COMPLETE/FAILED), amount_cents, timestamps
6. **`invitations`** — transaction_id, invited_email, token, status (pending/accepted/expired), expires_at, created_at
7. **`disputes`** — transaction_id, opened_by_profile_id, reason, description, status (open/under_review/resolved), resolution, resolved_by_admin_profile_id, resolved_at, timestamps
8. **`notifications`** — profile_id, type, title, body, read (default false), created_at

### Triggers:
- Auto-create profile + default buyer role on signup

### RLS Policies:
- All tables get RLS enabled with policies using `has_role()` function
- Buyers/sellers see only their own transactions, payments, disputes, events
- Admins can read/update all
- Insert/update restrictions per role and status as specified

---

## 2. Authentication

- Supabase Auth with email + password
- `/auth` page with login/signup tabs
- Post-signup: auto-create profile + buyer role via DB trigger
- Protected routes redirect unauthenticated users to `/auth`
- Role-based route guards (admin routes only for admin role)

---

## 3. Pages & Routes

### Public
- **`/`** — Landing page with hero section explaining escrow concept, CTA to sign up
- **`/auth`** — Login/Signup form with tabs

### Buyer/Seller (authenticated)
- **`/dashboard`** — Transaction list with status badges, search bar, status filter dropdown
- **`/transactions/new`** — Form (title, description, amount, delivery terms, due date, seller email) with Zod validation
- **`/transactions/:id`** — Transaction detail with summary card, parties info, timeline of events, and context-sensitive action buttons
- **`/disputes/:id`** — Dispute detail view with reason, description, status, and resolution outcome

### Admin
- **`/admin`** — All transactions overview with quick metrics (total, funded, disputed, released counts)
- **`/admin/disputes`** — List of open disputes with resolve actions (refund or release)
- **`/admin/users`** — User list with role management

---

## 4. Core Escrow Workflow (UI + Supabase)

### Step 1: Create Transaction
- Buyer fills form → inserts transaction (status: `awaiting_seller_acceptance`) + invitation record + notification to seller

### Step 2: Seller Accepts
- Seller sees pending invitation on dashboard → clicks Accept → status moves to `awaiting_payment` + event logged + notification to buyer

### Step 3: Simulated Payment
- Buyer clicks "Fund Transaction" → **Checkout Modal** opens:
  - Shows amount and currency
  - Payment method selector (Card / EFT / Wallet radio buttons)
  - "Force success" toggle for deterministic testing
  - "Pay Now" button
- On click: status → `payment_processing`, 2-3 second animated loader
- Result: success → insert payment (COMPLETE), status → `funded`; failure → insert payment (FAILED), status stays `awaiting_payment`
- Toast notification for outcome

### Step 4: Delivery & Confirmation
- Seller clicks "Mark Delivered" → status → `in_delivery` + event
- Buyer clicks "Confirm Receipt" → status → `buyer_confirmed` → auto-release → status → `released` + event + notifications

### Step 5: Disputes
- Either party opens dispute on funded/in_delivery transaction → status → `dispute_open` + dispute record + event + notification
- Admin resolves: choose refund or release → status → `dispute_resolved_refund` or `dispute_resolved_release` + event + notifications

---

## 5. UI Components

- **Dashboard cards** with color-coded status badges
- **Transaction detail page** with summary, parties, action buttons (role+status dependent), and scrollable timeline
- **Simulated Checkout Modal** (dialog) with method selector, force-success toggle, processing animation, success/failure result
- **Notification bell** in header with unread count, dropdown list, mark-as-read
- **Toast notifications** for all actions
- Clean, professional design using shadcn/ui components + Tailwind

---

## 6. Realtime & Notifications

- Supabase Realtime subscription on `notifications` table for the logged-in user
- Live update of notification bell count and dropdown
- Notification records created on: invitation sent, seller accepted, payment success/fail, dispute opened, dispute resolved, funds released

---

## 7. Code Organization

```
src/
  lib/supabaseClient.ts      — hardcoded Supabase URL + anon key
  types/                      — TypeScript types + enums for statuses, entities
  hooks/                      — useAuth, useTransactions, useNotifications, useProfile, etc.
  components/                 — reusable UI (CheckoutModal, StatusBadge, Timeline, etc.)
  pages/                      — all route pages
```

- Zod schemas for all forms
- Strict TypeScript types for all database entities and status enums
- React Query for data fetching and caching


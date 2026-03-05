# Supabase SQL Schema

Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query) to create all tables, RLS policies, triggers, and functions.

```sql
-- ============================================
-- 1. ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE public.transaction_status AS ENUM (
  'draft', 'awaiting_seller_acceptance', 'awaiting_payment', 'payment_processing',
  'funded', 'in_delivery', 'buyer_confirmed', 'released',
  'dispute_open', 'dispute_resolved_refund', 'dispute_resolved_release', 'cancelled'
);
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'COMPLETE', 'FAILED');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved');

-- ============================================
-- 2. TABLES
-- ============================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles (separate table to avoid RLS recursion)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  seller_email_invited TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status transaction_status NOT NULL DEFAULT 'draft',
  delivery_terms TEXT NOT NULL DEFAULT '',
  due_date DATE,
  buyer_confirmed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transaction Events (timeline/audit)
CREATE TABLE public.transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments (simulated)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'simulated',
  method TEXT NOT NULL,
  simulated_reference TEXT,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invitations
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disputes
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  opened_by_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status dispute_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  resolved_by_admin_profile_id UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. SECURITY DEFINER FUNCTION (avoids RLS recursion)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get profile id from auth user id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- ============================================
-- 4. AUTO-CREATE PROFILE + BUYER ROLE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- TRANSACTIONS
CREATE POLICY "Buyers/sellers can view their transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    buyer_id = public.get_profile_id(auth.uid())
    OR seller_id = public.get_profile_id(auth.uid())
    OR seller_email_invited = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers can create transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Parties can update their transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    buyer_id = public.get_profile_id(auth.uid())
    OR seller_id = public.get_profile_id(auth.uid())
    OR seller_email_invited = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Admins can update all transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- TRANSACTION EVENTS
CREATE POLICY "Parties can view transaction events" ON public.transaction_events
  FOR SELECT TO authenticated
  USING (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
        OR seller_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Admins can view all events" ON public.transaction_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parties can insert events" ON public.transaction_events
  FOR INSERT TO authenticated
  WITH CHECK (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
        OR seller_id = public.get_profile_id(auth.uid())
        OR seller_email_invited = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- PAYMENTS
CREATE POLICY "Parties can view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
        OR seller_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Buyer can insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INVITATIONS
CREATE POLICY "Parties can view invitations" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
        OR seller_id = public.get_profile_id(auth.uid())
        OR seller_email_invited = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "Buyers can create invitations" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Parties can update invitations" ON public.invitations
  FOR UPDATE TO authenticated
  USING (
    invited_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- DISPUTES
CREATE POLICY "Parties can view disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
        OR seller_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Parties can open disputes" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    opened_by_profile_id = public.get_profile_id(auth.uid())
    AND transaction_id IN (
      SELECT id FROM public.transactions
      WHERE buyer_id = public.get_profile_id(auth.uid())
        OR seller_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update disputes" ON public.disputes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- 7. ENABLE REALTIME FOR NOTIFICATIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

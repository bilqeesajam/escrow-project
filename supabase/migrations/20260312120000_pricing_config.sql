-- Pricing configuration and approvals

-- Add new enum types
DO $$ BEGIN
  CREATE TYPE public.pricing_approval_status AS ENUM ('auto_approved', 'pending_admin', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pricing_override_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Extend txn_type for platform fee
DO $$ BEGIN
  ALTER TYPE public.txn_type ADD VALUE IF NOT EXISTS 'platform_fee';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Pricing config table
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.gig_category NOT NULL UNIQUE,
  base_hourly_rate NUMERIC NOT NULL CHECK (base_hourly_rate >= 0),
  per_km_rate NUMERIC NOT NULL CHECK (per_km_rate >= 0),
  complexity_multipliers JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform_fee_percentage NUMERIC NOT NULL CHECK (platform_fee_percentage >= 0 AND platform_fee_percentage <= 100),
  min_budget NUMERIC NOT NULL CHECK (min_budget >= 0),
  max_budget NUMERIC NOT NULL CHECK (max_budget >= 0),
  suggested_band_pct NUMERIC NOT NULL DEFAULT 20 CHECK (suggested_band_pct >= 0 AND suggested_band_pct <= 100),
  updated_by UUID REFERENCES public.profiles(id),
  updated_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (min_budget <= max_budget)
);

DROP TRIGGER IF EXISTS update_pricing_config_updated_at ON public.pricing_config;
CREATE TRIGGER update_pricing_config_updated_at
BEFORE UPDATE ON public.pricing_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pricing config" ON public.pricing_config
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read pricing config" ON public.pricing_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Pricing config history
CREATE TABLE IF NOT EXISTS public.pricing_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_config_id UUID REFERENCES public.pricing_config(id) ON DELETE CASCADE,
  category public.gig_category NOT NULL,
  change_type TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  change_reason TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pricing_config_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read pricing config history" ON public.pricing_config_history
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Audit trigger for pricing config
CREATE OR REPLACE FUNCTION public.log_pricing_config_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.pricing_config_history (
    pricing_config_id,
    category,
    change_type,
    changed_by,
    change_reason,
    before_data,
    after_data
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.category, OLD.category),
    TG_OP,
    COALESCE(NEW.updated_by, OLD.updated_by),
    COALESCE(NEW.updated_reason, 'unspecified'),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_config_audit ON public.pricing_config;
CREATE TRIGGER pricing_config_audit
AFTER INSERT OR UPDATE OR DELETE ON public.pricing_config
FOR EACH ROW EXECUTE FUNCTION public.log_pricing_config_change();

-- Pricing overrides table
CREATE TABLE IF NOT EXISTS public.pricing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) NOT NULL,
  category public.gig_category NOT NULL,
  requested_budget NUMERIC NOT NULL CHECK (requested_budget > 0),
  suggested_budget NUMERIC NOT NULL CHECK (suggested_budget > 0),
  adjustment_pct NUMERIC NOT NULL,
  reason TEXT,
  status public.pricing_override_status NOT NULL DEFAULT 'pending',
  admin_id UUID REFERENCES public.profiles(id),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pricing_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own pricing overrides" ON public.pricing_overrides
  FOR SELECT USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can create pricing overrides" ON public.pricing_overrides
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can update pricing overrides" ON public.pricing_overrides
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Update gigs with pricing snapshot columns
ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS pricing_config_id UUID REFERENCES public.pricing_config(id),
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS pricing_subtotal NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_total NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_adjustment_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_complexity_multiplier NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_inputs JSONB,
  ADD COLUMN IF NOT EXISTS pricing_status public.pricing_approval_status DEFAULT 'auto_approved',
  ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS cart_value NUMERIC;

-- Backfill existing gigs to preserve retroactivity
UPDATE public.gigs
SET
  pricing_subtotal = COALESCE(pricing_subtotal, budget),
  pricing_fee = COALESCE(pricing_fee, 0),
  pricing_total = COALESCE(pricing_total, budget),
  pricing_status = COALESCE(pricing_status, 'auto_approved')
WHERE pricing_total IS NULL OR pricing_subtotal IS NULL OR pricing_status IS NULL;

-- Update transactions for fee breakdown
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS fee_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC;

-- Update gigs RLS policy for hustler marketplace to exclude unapproved pricing
DROP POLICY IF EXISTS "Hustlers can read open gigs" ON public.gigs;
CREATE POLICY "Hustlers can read open gigs" ON public.gigs
  FOR SELECT USING (
    status = 'open'
    AND public.has_role(auth.uid(), 'hustler')
    AND COALESCE(pricing_status, 'auto_approved') IN ('auto_approved', 'approved')
  );

-- Update updated_at trigger for pricing_overrides
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_pricing_overrides_updated_at ON public.pricing_overrides;
CREATE TRIGGER update_pricing_overrides_updated_at
BEFORE UPDATE ON public.pricing_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

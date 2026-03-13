
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('client', 'hustler', 'admin');

-- Create KYC status enum
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');

-- Create gig status enum
CREATE TYPE public.gig_status AS ENUM ('open', 'accepted', 'in_progress', 'pending_confirmation', 'completed', 'disputed', 'cancelled');

-- Create gig category enum
CREATE TYPE public.gig_category AS ENUM ('errand', 'pickup', 'delivery', 'shopping', 'other');

-- Create transaction type enum
CREATE TYPE public.txn_type AS ENUM ('hold', 'release', 'refund', 'top_up');

-- Create dispute status enum
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved_client', 'resolved_hustler');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  id_number TEXT,
  role app_role,
  kyc_status kyc_status DEFAULT 'pending',
  selfie_url TEXT,
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  )
$$;

-- Security definer function for KYC status check
CREATE OR REPLACE FUNCTION public.get_kyc_status(_user_id UUID)
RETURNS kyc_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT kyc_status FROM public.profiles WHERE id = _user_id
$$;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ========== USER ROLES (separate table for security) ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ========== GIGS ==========
CREATE TABLE public.gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  hustler_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC NOT NULL CHECK (budget > 0),
  location TEXT NOT NULL,
  category gig_category NOT NULL DEFAULT 'other',
  status gig_status NOT NULL DEFAULT 'open',
  completion_pin TEXT,
  client_confirmed BOOLEAN DEFAULT false,
  hustler_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create own gigs" ON public.gigs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can read own gigs" ON public.gigs FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Hustlers can read open gigs" ON public.gigs FOR SELECT USING (status = 'open' AND public.has_role(auth.uid(), 'hustler'));
CREATE POLICY "Hustlers can read assigned gigs" ON public.gigs FOR SELECT USING (auth.uid() = hustler_id);
CREATE POLICY "Admins can read all gigs" ON public.gigs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can update own gigs" ON public.gigs FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Hustlers can update assigned gigs" ON public.gigs FOR UPDATE USING (auth.uid() = hustler_id);
CREATE POLICY "Admins can update all gigs" ON public.gigs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== TRANSACTIONS ==========
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES public.gigs(id),
  from_user_id UUID REFERENCES public.profiles(id),
  to_user_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type txn_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Admins can read all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ========== DISPUTES ==========
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id),
  raised_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Function to check if user is participant of a gig
CREATE OR REPLACE FUNCTION public.is_gig_participant(_user_id UUID, _gig_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gigs WHERE id = _gig_id AND (client_id = _user_id OR hustler_id = _user_id)
  )
$$;

CREATE POLICY "Gig participants can read disputes" ON public.disputes FOR SELECT USING (public.is_gig_participant(auth.uid(), gig_id));
CREATE POLICY "Admins can read all disputes" ON public.disputes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gig participants can create disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = raised_by AND public.is_gig_participant(auth.uid(), gig_id));
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ========== NOTIFICATIONS ==========
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  gig_id UUID REFERENCES public.gigs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ========== STORAGE BUCKET FOR KYC ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-selfies', 'kyc-selfies', false);

CREATE POLICY "Users can upload own selfie" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own selfie" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all selfies" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-selfies' AND public.has_role(auth.uid(), 'admin'));


-- Add multi-device columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_logins integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_installed boolean DEFAULT false;

-- Authorized devices table
CREATE TABLE public.authorized_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  ip_address text,
  user_agent text,
  city text,
  country text,
  approved boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);
ALTER TABLE public.authorized_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all devices" ON public.authorized_devices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage devices" ON public.authorized_devices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own devices" ON public.authorized_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Blocked IPs table
CREATE TABLE public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  reason text,
  blocked_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Suspicious login attempts table
CREATE TABLE public.suspicious_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  device_fingerprint text,
  user_agent text,
  city text,
  country text,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.suspicious_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view suspicious attempts" ON public.suspicious_login_attempts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

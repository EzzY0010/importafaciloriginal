// The live site signs users in on the production project tracked by the repo
// (see src/integrations/supabase/client.ts). Photo analysis runs here, so the
// signed-in user's token is verified against that project and its own profile
// rules decide access. The publishable key below is public by design.
const PRODUCTION_URL = 'https://zmxktmjstvxmlsvdtvaa.supabase.co';
const PRODUCTION_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpteGt0bWpzdHZ4bWxzdmR0dmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDA2MTIsImV4cCI6MjA4NjA3NjYxMn0.yefw36-nT3dzcRxRh2RCj8Jo0eLdlb9glACHo4_qCPk';

export type AccessResult =
  | { ok: true; userId: string; source: 'production' | 'cloud' }
  | { ok: false; status: number; error: string; message?: string };

type Profile = { has_paid?: boolean | null; plan_type?: string | null; plan_expires_at?: string | null; legacy_access?: boolean | null };

export function profileHasFullAccess(profile: Profile | null | undefined, now = Date.now()): boolean {
  if (!profile || profile.has_paid !== true) return false;
  if (profile.legacy_access === true) return true;
  const plan = String(profile.plan_type ?? '').toLowerCase();
  if (plan === 'beginners' || plan === 'grupo') return false;
  const expiry = profile.plan_expires_at ? Date.parse(profile.plan_expires_at) : NaN;
  return Number.isFinite(expiry) && expiry > now;
}

async function checkProject(baseUrl: string, apiKey: string, jwt: string, source: 'production' | 'cloud'): Promise<AccessResult | null> {
  const headers = { apikey: apiKey, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
  const userRes = await fetch(`${baseUrl}/auth/v1/user`, { headers }).catch(() => null);
  if (!userRes?.ok) return null;
  const user = await userRes.json().catch(() => null);
  const userId = typeof user?.id === 'string' ? user.id : null;
  if (!userId) return null;

  const rpc = async (name: string, body: Record<string, unknown>) => {
    const res = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body) }).catch(() => null);
    if (!res?.ok) return false;
    return (await res.json().catch(() => false)) === true;
  };
  const profileRes = await fetch(
    `${baseUrl}/rest/v1/profiles?id=eq.${userId}&select=has_paid,plan_type,plan_expires_at,legacy_access`,
    { headers },
  ).catch(() => null);
  const rows = profileRes?.ok ? await profileRes.json().catch(() => []) : [];
  const profile: Profile | null = Array.isArray(rows) ? rows[0] ?? null : null;

  const [isAdmin, rpcAccess] = await Promise.all([
    rpc('has_role', { _user_id: userId, _role: 'admin' }),
    rpc('has_full_access', { _user_id: userId }),
  ]);
  if (isAdmin) return { ok: true, userId, source };
  if (!rpcAccess && !profileHasFullAccess(profile)) {
    console.log('[app-auth] access denied', { source, plan: profile?.plan_type ?? null });
    return { ok: false, status: 403, error: 'subscription_expired' };
  }
  if (profile?.plan_type === 'beginners' && profile.legacy_access !== true) {
    return { ok: false, status: 403, error: 'beginners_plan_restricted', message: 'A análise por foto está disponível no Importafacil Elite.' };
  }
  return { ok: true, userId, source };
}

export async function verifyAppUser(req: Request): Promise<AccessResult> {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return { ok: false, status: 401, error: 'unauthorized' };
  const production = await checkProject(PRODUCTION_URL, PRODUCTION_PUBLISHABLE_KEY, jwt, 'production');
  if (production) return production;
  const cloudUrl = Deno.env.get('SUPABASE_URL');
  const cloudKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (cloudUrl && cloudKey && cloudUrl !== PRODUCTION_URL) {
    const cloud = await checkProject(cloudUrl, cloudKey, jwt, 'cloud');
    if (cloud) return cloud;
  }
  return { ok: false, status: 401, error: 'unauthorized' };
}

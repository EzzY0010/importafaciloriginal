import { useEffect } from 'react';
import { getSupabaseClient, isBackendConfigured } from '@/lib/backend';

/**
 * Lightweight resilience: refresh Supabase session when the tab becomes
 * visible again so tokens don't go stale. No overlays, no fetch patching,
 * no forced reloads — the chat and API flow stays clean and direct.
 */
const ACTIVE_TAB_KEY = 'importafacil:activeTab';

const AppResilience: React.FC = () => {
  useEffect(() => {
    const refreshSession = async () => {
      if (!isBackendConfigured) return;
      try {
        const client = await getSupabaseClient();
        if (!client) return;
        // Silent token refresh so subsequent requests use a valid JWT.
        await client.auth.refreshSession();
      } catch (e) {
        console.warn('[Resilience] session refresh failed', e);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, []);

  return null;
};

export const getSavedActiveTab = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_TAB_KEY);
  } catch {
    return null;
  }
};

export const saveActiveTab = (tab: string) => {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  } catch {}
};

export default AppResilience;
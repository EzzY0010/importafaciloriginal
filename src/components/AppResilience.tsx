import { useEffect } from 'react';
import { getSupabaseClient, isBackendConfigured } from '@/lib/backend';

/**
 * Handles tab-resume edge cases:
 *  - When the tab becomes visible again, force a Supabase session refresh
 *    so expired/stale tokens don't trigger 400 on the next request.
 *  - Intercepts fetch globally to catch auth-related 400/401 responses
 *    that happen right after returning from background, and performs a
 *    soft reload that preserves the active tab (saved in localStorage).
 */
const ACTIVE_TAB_KEY = 'importafacil:activeTab';
const RECOVERED_FLAG = 'importafacil:justRecovered';

const AppResilience: React.FC = () => {
  useEffect(() => {
    let resumedAt = 0;
    let reloading = false;

    const softReload = () => {
      if (reloading) return;
      reloading = true;
      try {
        sessionStorage.setItem(RECOVERED_FLAG, '1');
      } catch {}
      // Stay on the same route — just reload data/state.
      window.location.reload();
    };

    const refreshSession = async () => {
      if (!isBackendConfigured) return;
      try {
        const client = await getSupabaseClient();
        if (!client) return;
        // Force token refresh so subsequent requests use a valid JWT.
        const { error } = await client.auth.refreshSession();
        if (error) {
          // Fallback: try to read current session; if missing, soft reload
          const { data } = await client.auth.getSession();
          if (!data.session) softReload();
        }
      } catch (e) {
        console.warn('[Resilience] session refresh failed', e);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        resumedAt = Date.now();
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    // Patch fetch ONCE to catch post-resume 400s gracefully.
    const w = window as unknown as { __resilienceFetchPatched?: boolean };
    if (!w.__resilienceFetchPatched) {
      w.__resilienceFetchPatched = true;
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (...args: Parameters<typeof fetch>) => {
        try {
          const res = await originalFetch(...args);
          // Only react shortly after tab resume, to avoid disrupting normal 400s
          const recentlyResumed = Date.now() - resumedAt < 8000;
          if (recentlyResumed && (res.status === 400 || res.status === 401)) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
            if (url && /supabase\.co|\/auth\/v1|\/rest\/v1|\/functions\/v1/.test(url)) {
              console.warn('[Resilience] post-resume', res.status, 'detected — recovering');
              softReload();
            }
          }
          return res;
        } catch (err) {
          throw err;
        }
      };
    }

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
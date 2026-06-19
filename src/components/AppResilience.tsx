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
    let serverErrorShown = false;

    const softReload = () => {
      if (reloading) return;
      reloading = true;
      try {
        sessionStorage.setItem(RECOVERED_FLAG, '1');
      } catch {}
      // Stay on the same route — just reload data/state.
      window.location.reload();
    };

    // Show a friendly themed overlay when a 500 happens after inactivity,
    // then auto-redirect to "/" after 3 seconds. Silent / non-intrusive.
    const showServerErrorOverlay = () => {
      if (serverErrorShown) return;
      serverErrorShown = true;

      const overlay = document.createElement('div');
      overlay.id = 'if-server-error-overlay';
      overlay.setAttribute('role', 'alertdialog');
      overlay.style.cssText = [
        'position:fixed','inset:0','z-index:2147483647',
        'display:flex','align-items:center','justify-content:center',
        'background:rgba(8,15,30,0.85)','backdrop-filter:blur(6px)',
        'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
        'padding:24px','animation:ifFade .25s ease-out',
      ].join(';');

      overlay.innerHTML = `
        <style>@keyframes ifFade{from{opacity:0}to{opacity:1}}@keyframes ifSpin{to{transform:rotate(360deg)}}</style>
        <div style="max-width:380px;width:100%;background:linear-gradient(180deg,#0f1d3a 0%,#0b1530 100%);border:1px solid rgba(212,175,55,0.35);border-radius:20px;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5);color:#fff;">
          <div style="width:48px;height:48px;border:3px solid rgba(212,175,55,.25);border-top-color:#D4AF37;border-radius:50%;margin:0 auto 16px;animation:ifSpin 1s linear infinite;"></div>
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#fff;">Sua sessão expirou por inatividade</h2>
          <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,.75);line-height:1.5;">Reconectando você ao ImportaFácil...</p>
          <button id="if-reload-btn" style="background:#D4AF37;color:#0b1530;border:none;border-radius:12px;padding:12px 22px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(212,175,55,.35);">Recarregar App</button>
        </div>`;

      document.body.appendChild(overlay);
      const btn = overlay.querySelector('#if-reload-btn') as HTMLButtonElement | null;
      const goHome = () => { window.location.href = '/'; };
      btn?.addEventListener('click', goHome);
      setTimeout(goHome, 3000);
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
          // Critical: any 500 from our backend = show friendly overlay + auto-redirect.
          if (res.status >= 500 && res.status < 600) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
            if (url && /supabase\.co|\/auth\/v1|\/rest\/v1|\/functions\/v1/.test(url)) {
              console.warn('[Resilience] server', res.status, 'detected — showing recovery UI');
              showServerErrorOverlay();
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
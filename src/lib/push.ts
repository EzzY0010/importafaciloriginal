import { getSupabaseClient } from "@/lib/backend";

export const VAPID_PUBLIC_KEY =
  "BMQ8CZWXqh8C_8xJ6IkCM9yFh5JvgOTqTuqOSQUKo6Mt70WVZuB_LJ-Mw9fu87CFDYU8t7BjXOmsh2_9hRvTTLs";

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  typeof Notification !== "undefined";

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true);

export const isIOS = () =>
  typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
};

const bufToBase64Url = (buf: ArrayBuffer | null) => {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return window.btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Pede permissão, assina o push e salva o dispositivo (RLS libera só para admin). */
export const enablePushNotifications = async (): Promise<{ ok: boolean; error?: string }> => {
  if (!pushSupported()) return { ok: false, error: "Este navegador não suporta notificações push." };

  const registration = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  if (!registration) return { ok: false, error: "Não foi possível registrar o service worker." };
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "Permissão de notificação negada." };

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const supabase = await getSupabaseClient();
  if (!supabase) return { ok: false, error: "Backend indisponível." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Faça login como administrador." };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: bufToBase64Url(subscription.getKey("p256dh")),
      auth: bufToBase64Url(subscription.getKey("auth")),
      user_agent: navigator.userAgent,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
};

export const hasActivePushSubscription = async () => {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  return Boolean(await reg.pushManager.getSubscription());
};

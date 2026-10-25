import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const FALLBACK_BACKEND_URL = 'https://zmxktmjstvxmlsvdtvaa.supabase.co';
const FALLBACK_BACKEND_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6bXhrdG1qc3R2eG1sc3ZkdHZhYSIsInJlZiI6InpteGt0bWpzdHZ4bWxzdmR0dmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDA2MTIsImV4cCI6MjA4NjA3NjYxMn0.yefw36-nT3dzcRxRh2RCj8Jo0eLdlb9glACHo4_qCPk';

export const backendUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_BACKEND_URL;
export const backendKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  FALLBACK_BACKEND_KEY;

export const isBackendConfigured = Boolean(backendUrl && backendKey);

let cachedClient: SupabaseClient<Database> | null = null;

export const getSupabaseClient = async (): Promise<SupabaseClient<Database> | null> => {
  if (!isBackendConfigured) return null;
  if (cachedClient) return cachedClient;

  try {
    const module = await import('@/integrations/supabase/client');
    cachedClient = module.supabase;
    return cachedClient;
  } catch {
    cachedClient = createClient<Database>(backendUrl, backendKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  }
};

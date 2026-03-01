import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, deviceFingerprint } = await req.json();
    if (!userId || !deviceFingerprint) {
      return new Response(JSON.stringify({ error: 'Missing data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_device_fingerprint, last_ip, last_city, last_country, last_login_at, device_approved, last_latitude, last_longitude')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get IP info from request or external API
    let ipInfo = { ip: '', city: '', country: '', lat: 0, lon: 0 };
    try {
      const ipRes = await fetch('http://ip-api.com/json/?fields=query,city,country,lat,lon');
      const ipData = await ipRes.json();
      ipInfo = { ip: ipData.query, city: ipData.city, country: ipData.country, lat: ipData.lat, lon: ipData.lon };
    } catch {
      console.error('Failed to get IP info');
    }

    // RULE 1: Device Binding
    if (profile.last_device_fingerprint && profile.last_device_fingerprint !== deviceFingerprint) {
      if (!profile.device_approved || profile.last_device_fingerprint !== deviceFingerprint) {
        // Different device detected - block
        return new Response(JSON.stringify({
          blocked: true,
          reason: 'device_mismatch',
          message: 'Dispositivo não autorizado. Entre em contato com o administrador para liberar seu novo aparelho.'
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // RULE 2: Geolocation check (200km in less than 2 hours)
    if (profile.last_latitude && profile.last_longitude && profile.last_login_at && ipInfo.lat && ipInfo.lon) {
      const distance = haversineDistance(profile.last_latitude, profile.last_longitude, ipInfo.lat, ipInfo.lon);
      const timeDiffHours = (Date.now() - new Date(profile.last_login_at).getTime()) / (1000 * 60 * 60);

      if (distance > 200 && timeDiffHours < 2) {
        return new Response(JSON.stringify({
          blocked: true,
          reason: 'geo_suspicious',
          message: `Login suspeito detectado. Distância de ${Math.round(distance)}km em ${Math.round(timeDiffHours * 60)} minutos. Conta bloqueada por segurança.`
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // All checks passed - update profile with current login info
    const isFirstLogin = !profile.last_device_fingerprint;
    await supabase.from('profiles').update({
      last_device_fingerprint: deviceFingerprint,
      last_ip: ipInfo.ip,
      last_city: ipInfo.city,
      last_country: ipInfo.country,
      last_latitude: ipInfo.lat,
      last_longitude: ipInfo.lon,
      last_login_at: new Date().toISOString(),
      device_approved: isFirstLogin ? true : profile.device_approved,
    }).eq('id', userId);

    return new Response(JSON.stringify({ blocked: false }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('login-check error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

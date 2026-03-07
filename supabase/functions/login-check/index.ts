import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { userId, deviceFingerprint, userAgent } = await req.json();
    if (!userId || !deviceFingerprint) {
      return new Response(JSON.stringify({ error: 'Missing data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('last_device_fingerprint, last_ip, last_city, last_country, last_login_at, device_approved, last_latitude, last_longitude, max_logins, app_installed')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get IP info
    let ipInfo = { ip: '', city: '', country: '', lat: 0, lon: 0 };
    try {
      const ipRes = await fetch('http://ip-api.com/json/?fields=query,city,country,lat,lon');
      const ipData = await ipRes.json();
      ipInfo = { ip: ipData.query, city: ipData.city, country: ipData.country, lat: ipData.lat, lon: ipData.lon };
    } catch {
      console.error('Failed to get IP info');
    }

    // CHECK: IP Blacklist
    if (ipInfo.ip) {
      const { data: blockedIp } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', ipInfo.ip)
        .maybeSingle();

      if (blockedIp) {
        // Log suspicious attempt
        await supabase.from('suspicious_login_attempts').insert({
          user_id: userId,
          ip_address: ipInfo.ip,
          device_fingerprint: deviceFingerprint,
          user_agent: userAgent,
          city: ipInfo.city,
          country: ipInfo.country,
          reason: 'blocked_ip',
        });

        return new Response(JSON.stringify({
          blocked: true,
          reason: 'blocked_ip',
          message: 'Este IP está bloqueado. Entre em contato com o administrador.'
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get user's authorized devices
    const { data: authorizedDevices } = await supabase
      .from('authorized_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('approved', true);

    const devices = authorizedDevices || [];
    const maxLogins = profile.max_logins || 1;
    const isKnownDevice = devices.some(d => d.device_fingerprint === deviceFingerprint);

    // MULTI-DEVICE LOGIC
    if (!isKnownDevice) {
      if (devices.length >= maxLogins) {
        // Too many devices - log suspicious attempt
        await supabase.from('suspicious_login_attempts').insert({
          user_id: userId,
          ip_address: ipInfo.ip,
          device_fingerprint: deviceFingerprint,
          user_agent: userAgent,
          city: ipInfo.city,
          country: ipInfo.country,
          reason: `exceeded_device_limit (${devices.length}/${maxLogins})`,
        });

        // Auto-blacklist: check if 5+ different IPs in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentAttempts } = await supabase
          .from('suspicious_login_attempts')
          .select('ip_address')
          .eq('user_id', userId)
          .gte('created_at', oneHourAgo);

        const uniqueIps = new Set((recentAttempts || []).map(a => a.ip_address).filter(Boolean));
        if (uniqueIps.size >= 5 && ipInfo.ip) {
          await supabase.from('blocked_ips').upsert({
            ip_address: ipInfo.ip,
            reason: `Auto-blocked: ${uniqueIps.size} IPs diferentes em 1h para usuário ${userId}`,
          }, { onConflict: 'ip_address' });
        }

        return new Response(JSON.stringify({
          blocked: true,
          reason: 'device_limit_exceeded',
          message: `Limite de ${maxLogins} dispositivo(s) atingido. Seu acesso é exclusivo para até ${maxLogins} dispositivo(s) vinculado(s). Entre em contato com o administrador.`
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Register new authorized device
      await supabase.from('authorized_devices').upsert({
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        ip_address: ipInfo.ip,
        user_agent: userAgent,
        city: ipInfo.city,
        country: ipInfo.country,
        approved: true,
      }, { onConflict: 'user_id,device_fingerprint' });
    }

    // GEOLOCATION CHECK (200km in less than 2h)
    if (profile.last_latitude && profile.last_longitude && profile.last_login_at && ipInfo.lat && ipInfo.lon) {
      const distance = haversineDistance(profile.last_latitude, profile.last_longitude, ipInfo.lat, ipInfo.lon);
      const timeDiffHours = (Date.now() - new Date(profile.last_login_at).getTime()) / (1000 * 60 * 60);

      if (distance > 200 && timeDiffHours < 2) {
        await supabase.from('suspicious_login_attempts').insert({
          user_id: userId,
          ip_address: ipInfo.ip,
          device_fingerprint: deviceFingerprint,
          user_agent: userAgent,
          city: ipInfo.city,
          country: ipInfo.country,
          reason: `geo_suspicious: ${Math.round(distance)}km in ${Math.round(timeDiffHours * 60)}min`,
        });

        return new Response(JSON.stringify({
          blocked: true,
          reason: 'geo_suspicious',
          message: `Login suspeito detectado. Distância de ${Math.round(distance)}km em ${Math.round(timeDiffHours * 60)} minutos. Conta bloqueada por segurança.`
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // All checks passed - update profile
    await supabase.from('profiles').update({
      last_device_fingerprint: deviceFingerprint,
      last_ip: ipInfo.ip,
      last_city: ipInfo.city,
      last_country: ipInfo.country,
      last_latitude: ipInfo.lat,
      last_longitude: ipInfo.lon,
      last_login_at: new Date().toISOString(),
      last_user_agent: userAgent || null,
      device_approved: true,
    }).eq('id', userId);

    // Build response message for multi-device notification
    let extraMessage = null;
    if (!isKnownDevice && devices.length === 0 && maxLogins > 1) {
      extraMessage = `Dispositivo registrado! Você pode usar até ${maxLogins} dispositivo(s).`;
    } else if (!isKnownDevice && devices.length > 0) {
      extraMessage = `Novo dispositivo autorizado (${devices.length + 1}/${maxLogins}). Atenção: Seu acesso é exclusivo para até ${maxLogins} dispositivo(s) vinculado(s).`;
    }

    return new Response(JSON.stringify({ blocked: false, message: extraMessage }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('login-check error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

(function () {
  window.__RAMDANI_RECOVERY_HREF = window.__RAMDANI_RECOVERY_HREF || location.href;
  window.__RAMDANI_RECOVERY_SEARCH = window.__RAMDANI_RECOVERY_SEARCH || location.search || '';
  window.__RAMDANI_RECOVERY_HASH = window.__RAMDANI_RECOVERY_HASH || location.hash || '';

  var cfg = window.RAMDANI_CONFIG;
  if (!cfg || !window.supabase) {
    console.error('Ramdani: Supabase client library or config missing');
    return;
  }
  window.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {\n    auth: {\n      persistSession: true,\n      autoRefreshToken: true,\n      detectSessionInUrl: false,\n      flowType: 'pkce',\n      storage: window.localStorage\n    }
  });
})();
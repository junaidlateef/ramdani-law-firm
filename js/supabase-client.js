(function () {
  var cfg = window.RAMDANI_CONFIG;
  if (!cfg || !window.supabase) {
    console.error('Ramdani: Supabase client library or config missing');
    return;
  }
  window.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();

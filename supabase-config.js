/* Public browser configuration. Row Level Security protects every private write. */
window.SL_SUPABASE_CONFIG = Object.freeze({
  url: 'https://ttugwcsgurukaecjcmgo.supabase.co',
  publishableKey: 'sb_publishable_V8Z9VIO764DUDLZ9Zk3bSA_5lNl6CDB',
  adminUsername: 'yashmacaraya123-create'
});
window.slSupabase = window.supabase.createClient(
  window.SL_SUPABASE_CONFIG.url,
  window.SL_SUPABASE_CONFIG.publishableKey,
  { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }
);

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://ubulqgaaomnvwzicrmus.supabase.co", // URL de tu proyecto
  "sb_publishable_XhWQbBxT_AI8-8fXES7JLA_KcQQKEvw", // KEY pública
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

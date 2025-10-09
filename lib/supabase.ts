import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client pour les opérations côté client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client avec service role pour les opérations admin (côté serveur uniquement)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

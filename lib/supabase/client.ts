import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Client-side Supabase client with types
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Defer hard failure until runtime usage
    return createClient<Database>("http://localhost", "anon-key");
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
})();

// Browser client for SSR
export const createClientComponentClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client (for API routes)
export const createServerClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Admin client with service role key (for server-side operations)
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || !supabaseUrl) {
    // Defer failure until runtime usage; provide inert fallback for build
    return createClient<Database>("http://localhost", "service-role-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export { createClient };

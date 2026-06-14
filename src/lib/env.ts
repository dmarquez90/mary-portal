const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
}

export const SUPABASE_URL: string = url;
export const SUPABASE_ANON_KEY: string = anonKey;
/** Server-only. Used by API routes that need to bypass RLS (e.g. external coupon validation). */
export const SUPABASE_SERVICE_ROLE_KEY: string | undefined = serviceRoleKey;

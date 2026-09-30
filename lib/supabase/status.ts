const PLACEHOLDER_VALUES = new Set([
  "your-supabase-url",
  "your-anon-key",
  "your-service-role-key",
  "",
  undefined,
]);

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !PLACEHOLDER_VALUES.has(url) && !PLACEHOLDER_VALUES.has(anonKey);
}

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

let browserClient: SupabaseClient<Database> | null | undefined;

export function createClient(): SupabaseClient<Database> | null {
  if (browserClient !== undefined) return browserClient;
  const config = getSupabaseConfig();
  browserClient = config ? createBrowserClient<Database>(config.url, config.key) : null;
  return browserClient;
}

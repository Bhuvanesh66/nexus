import { createServerClient } from "@supabase/ssr";
import { requestContext } from "../../request-context";

/**
 * Supabase for the signed-in app. Only the public URL and publishable key are used: every query runs as
 * the signed-in user, so row-level security decides what they can see. No service-role key is needed.
 */
export const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/** A client bound to this request's cookies. Create one per request. */
export async function createClient() {
  const context = requestContext.getStore();
  if (!context) throw new Error("Supabase requires an HTTP request context");
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return Object.entries(context.req.cookies ?? {}).map(([name, value]) => ({ name, value: String(value) }));
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.req.cookies[name] = value;
          const { maxAge, ...rest } = options;
          context.res.cookie(name, value, { ...rest, ...(maxAge === undefined ? {} : { maxAge: maxAge * 1000 }) });
        });
        Object.entries(headers ?? {}).forEach(([name, value]) => context.res.setHeader(name, value));
      },
    },
  });
}

/** The signed-in user (verified with Supabase Auth), with a client to query as them, or null. */
export async function getSession() {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}

/** Whether the Google provider is switched on in Supabase Auth. Cached for a minute. */
export async function googleEnabled() {
  if (!supabaseConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_KEY },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(settings.external?.google);
  } catch {
    return false;
  }
}

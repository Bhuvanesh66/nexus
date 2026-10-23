/**
 * Site-wide constants for the public landing page.
 *
 * Sign-in: the product spec calls for Google OAuth through Supabase Auth, which is not wired up in this
 * repository yet. Every "Try Free with Google" and "Sign in" link points at SIGN_IN_HREF. Until the auth
 * flow exists it resolves to /sign-in, an honest placeholder page. To connect the real flow, either set
 * NEXT_PUBLIC_SIGN_IN_URL (for example to the route that calls supabase.auth.signInWithOAuth) or replace
 * app/sign-in/page.tsx with that route.
 */
export const SIGN_IN_HREF = process.env.NEXT_PUBLIC_SIGN_IN_URL || "/sign-in";

export const SITE_NAME = "Second Brain";

export const SITE_DESCRIPTION =
  "Drop in what you learn. Second Brain connects the dots and brings the right insights back when you have something real to do.";

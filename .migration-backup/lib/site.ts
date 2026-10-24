/**
 * Site-wide constants for the public landing page.
 *
 * Every "Try Nexus free" and "Sign in" link points at SIGN_IN_HREF, the route that starts Google sign-in
 * through Supabase Auth (or goes straight to the dashboard when the visitor is already signed in). It is a
 * route handler, so the links are plain anchors, not client-side navigations.
 */
export const SIGN_IN_HREF = "/auth/sign-in";

export const SITE_NAME = "Nexus";

export const SITE_TITLE = "Nexus — Beyond memory.";

export const SITE_DESCRIPTION =
  "Nexus is where everything you’ve learned meets the task you’re doing — and the work gets done.";

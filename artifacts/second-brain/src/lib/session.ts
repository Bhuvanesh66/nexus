import { useEffect, useState } from "react";
import { SITE_NAME, SITE_TITLE } from "@/lib/site";

export type SessionUser = { name: string; email: string; avatar: string | null };
export type Session = { user: SessionUser | null; aiReady: boolean; configured: boolean; googleEnabled: boolean };

/** GET /api/session; null while loading. A failed request reads as signed out and not configured. */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/session", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((body: Session) => live && setSession(body))
      .catch(() => live && setSession({ user: null, aiReady: false, configured: false, googleEnabled: false }));
    return () => {
      live = false;
    };
  }, []);
  return session;
}

/** The document title and robots meta for a page, as the Next metadata did. */
export function usePageMeta(title: string | null, options: { noindex?: boolean; description?: string } = {}) {
  const { noindex = false, description } = options;
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_TITLE;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex";
    } else robots?.remove();
    if (description) document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", description);
  }, [title, noindex, description]);
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME}: your knowledge, put to work`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME}: stop collecting, start remembering, start doing`,
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

/**
 * Marks the page as scripted before first paint, so below-the-fold sections may start hidden and reveal
 * on scroll. If the reveal observer never starts, everything is shown after five seconds.
 */
const BOOT_SCRIPT =
  "document.documentElement.classList.add('js');" +
  "setTimeout(function(){if(!window.__sbRevealReady)document.documentElement.classList.add('reveal-all')},5000);";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The boot script adds classes to <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}

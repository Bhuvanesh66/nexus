import { useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { usePageMeta, useSession } from "@/lib/session";

export default function DashboardPage() {
  usePageMeta("Your Nexus", { noindex: true });
  const session = useSession();
  const signedOut = session !== null && !session.user;

  useEffect(() => {
    if (signedOut) window.location.replace("/sign-in");
  }, [signedOut]);

  if (!session?.user) return null;
  const { user } = session;
  return <AppShell user={{ name: user.name || user.email || "You", email: user.email ?? "", avatar: user.avatar ?? null }} aiReady={session.aiReady} />;
}

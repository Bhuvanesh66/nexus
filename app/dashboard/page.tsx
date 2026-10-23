import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { claudeConfigured } from "@/lib/ai";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your Nexus",
  robots: { index: false },
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { user } = session;
  const meta = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string };
  const name = meta.full_name ?? meta.name ?? user.email ?? "You";

  return (
    <AppShell
      user={{ name, email: user.email ?? "", avatar: meta.avatar_url ?? meta.picture ?? null }}
      aiReady={claudeConfigured()}
    />
  );
}

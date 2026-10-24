import { NextResponse, type NextRequest } from "next/server";
import type { Toolkit } from "@/lib/actions";
import { composioConfigured, connectedToolkits, connectLink, TOOLKITS } from "@/lib/composio";
import { fail, SIGNED_OUT } from "@/lib/http";
import { getSession } from "@/lib/supabase/server";

/** Whether the execution layer is set up, and which of the user's apps are connected to it. */
export async function GET() {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  if (!composioConfigured()) {
    return NextResponse.json({ configured: false, toolkits: { gmail: false, googlecalendar: false } });
  }
  try {
    const toolkits = await connectedToolkits(session.user.id);
    return NextResponse.json({ configured: true, toolkits }, { headers: { "cache-control": "no-store" } });
  } catch {
    return fail(502, "connections-failed", "Nexus couldn’t check your connected apps just now.");
  }
}

/** Starts connecting one app: returns the Composio page where the user signs in to it. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  if (!composioConfigured()) return fail(503, "not-configured", "Connecting apps isn’t set up on this deployment yet.");

  const body = (await request.json().catch(() => null)) as { toolkit?: unknown } | null;
  const toolkit = TOOLKITS.find((t) => t === body?.toolkit) as Toolkit | undefined;
  if (!toolkit) return fail(400, "bad-toolkit", "Nexus can connect Gmail and Google Calendar for now.");

  try {
    const url = await connectLink(session.user.id, toolkit, `${request.nextUrl.origin}/connected?app=${toolkit}`);
    return NextResponse.json({ url }, { headers: { "cache-control": "no-store" } });
  } catch {
    return fail(502, "connect-failed", "Nexus couldn’t start connecting that app. Try again in a moment.");
  }
}

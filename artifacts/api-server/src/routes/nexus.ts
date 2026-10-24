import { Router, type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { requestContext } from "../nexus/request-context";
import { aiConfigured } from "../nexus/lib/ai";
import { getSession, googleEnabled, supabaseConfigured, SUPABASE_URL, SUPABASE_KEY } from "../nexus/lib/supabase/server";
import * as capture from "../nexus/handlers/capture/route";
import * as captures from "../nexus/handlers/captures/route";
import * as captureDetail from "../nexus/handlers/captures/[id]/route";
import * as ask from "../nexus/handlers/ask/route";
import * as actions from "../nexus/handlers/actions/route";
import * as actionDetail from "../nexus/handlers/actions/[id]/route";
import * as connections from "../nexus/handlers/connections/route";
import * as uploads from "../nexus/handlers/uploads/route";
import * as signIn from "../nexus/auth/sign-in/route";
import * as signOut from "../nexus/auth/sign-out/route";
import * as callback from "../nexus/auth/callback/route";

type Handler = (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>;

/** Express boundary for the existing Fetch API handlers; business logic stays unchanged. */
function handle(handler: Handler) {
  return async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
    await requestContext.run({ req, res }, async () => {
      const controller = new AbortController();
      res.on("close", () => { if (!res.writableEnded) controller.abort(); });
      const host = req.get("x-forwarded-host")?.split(",")[0].trim() || req.get("host");
      const protocol = req.get("x-forwarded-proto")?.split(",")[0].trim() || req.protocol;
      const url = `${protocol}://${host}${req.originalUrl}`;
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
      const hasBody = !["GET", "HEAD"].includes(req.method);
      const request = new Request(url, {
        method: req.method,
        headers,
        ...(hasBody && req.body !== undefined ? { body: JSON.stringify(req.body) } : {}),
        signal: controller.signal,
      });
      const response = await handler(request, { params: Promise.resolve({ id: String(req.params.id ?? "") }) });
      res.status(response.status);
      response.headers.forEach((value, name) => {
        if (name !== "set-cookie") res.setHeader(name, value);
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      res.end(bytes);
    });
  };
}

export const nexusRouter = Router();
nexusRouter.post("/capture", handle(capture.POST));
nexusRouter.get("/captures", handle(captures.GET));
nexusRouter.get("/captures/:id", handle(captureDetail.GET));
nexusRouter.delete("/captures/:id", handle(captureDetail.DELETE));
nexusRouter.get("/ask", handle(ask.GET));
nexusRouter.post("/ask", handle(ask.POST));
nexusRouter.get("/actions", handle(actions.GET));
nexusRouter.post("/actions", handle(actions.POST));
nexusRouter.post("/actions/:id", handle(actionDetail.POST));
nexusRouter.get("/connections", handle(connections.GET));
nexusRouter.post("/connections", handle(connections.POST));
nexusRouter.post("/uploads", handle(uploads.POST));

nexusRouter.get("/session", handle(async () => {
  const session = await getSession();
  const user = session?.user;
  const meta = user?.user_metadata ?? {};
  return Response.json({
    user: user ? {
      name: meta.full_name ?? meta.name ?? user.email ?? "You",
      email: user.email ?? "",
      avatar: meta.avatar_url ?? meta.picture ?? null,
    } : null,
    aiReady: aiConfigured(),
    configured: supabaseConfigured(),
    googleEnabled: await googleEnabled(),
  }, { headers: { "cache-control": "no-store" } });
}));
nexusRouter.get("/config", (_req, res) => {
  // Supabase's publishable key is public by design. Never return a service-role key.
  res.json({ supabaseKey: SUPABASE_KEY });
});
nexusRouter.get("/stats", handle(async () => {
  if (!supabaseConfigured()) return Response.json({ stats: null });
  const supabase = createSupabase(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("nexus_stats");
  const row = Array.isArray(data) ? data[0] : data;
  return Response.json({ stats: error || !row ? null : {
    users: Number(row.users), captures: Number(row.captures), asks: Number(row.asks),
  } }, { headers: { "cache-control": "no-store" } });
}));

export const authRouter = Router();
authRouter.get("/sign-in", handle(signIn.GET));
authRouter.get("/callback", handle(callback.GET));
authRouter.post("/sign-out", handle(signOut.POST));

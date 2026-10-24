import type { Toolkit } from "./actions";
import { logger } from "./logger";

/**
 * Composio (composio.dev), the execution layer: it holds each user's connection to their own Gmail and Google
 * Calendar (through Composio's verified Google app) and performs one tool call at a time on their behalf.
 * Plain REST against API v3.1 instead of the SDK, to keep serverless functions small. Server only, with
 * COMPOSIO_API_KEY. The Composio user id is the Supabase user id.
 */

const BASE = "https://backend.composio.dev/api/v3.1";
export const TOOLKITS: Toolkit[] = ["gmail", "googlecalendar"];

export class ComposioError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function composioConfigured() {
  return Boolean(process.env.COMPOSIO_API_KEY);
}

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method ?? "GET",
      headers: { "x-api-key": process.env.COMPOSIO_API_KEY as string, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new ComposioError("Composio could not be reached.", 0);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logger.error(`Composio ${init.method ?? "GET"} ${path.split("?")[0]} returned ${res.status}`);
    throw new ComposioError(`Composio returned ${res.status}.`, res.status);
  }
  return (await res.json()) as T;
}

/** Which of Nexus's toolkits this user has an active connection to. */
export async function connectedToolkits(userId: string): Promise<Record<Toolkit, boolean>> {
  const body = await api<{ items?: { toolkit?: { slug?: string }; status?: string }[] }>(
    `/connected_accounts?user_ids=${encodeURIComponent(userId)}&statuses=ACTIVE&limit=50`,
  );
  const slugs = new Set((body.items ?? []).filter((i) => i.status === "ACTIVE").map((i) => i.toolkit?.slug?.toLowerCase()));
  return { gmail: slugs.has("gmail"), googlecalendar: slugs.has("googlecalendar") };
}

const authConfigs = new Map<Toolkit, string>();

/** The project's Composio-managed auth config for a toolkit, created on first use. */
async function authConfigFor(toolkit: Toolkit) {
  const cached = authConfigs.get(toolkit);
  if (cached) return cached;
  const list = await api<{ items?: { id: string; is_composio_managed?: boolean; status?: string }[] }>(
    `/auth_configs?toolkit_slug=${toolkit}&is_composio_managed=true&limit=10`,
  );
  let id = list.items?.find((c) => c.status !== "DISABLED")?.id;
  if (!id) {
    const created = await api<{ auth_config: { id: string } }>("/auth_configs", {
      method: "POST",
      body: {
        toolkit: { slug: toolkit },
        auth_config: { type: "use_composio_managed_auth", name: `Nexus ${toolkit}` },
      },
    });
    id = created.auth_config.id;
  }
  authConfigs.set(toolkit, id);
  return id;
}

/** A Composio Connect link: the user signs in to the app there, then lands on `callbackUrl`. */
export async function connectLink(userId: string, toolkit: Toolkit, callbackUrl: string) {
  const authConfigId = await authConfigFor(toolkit);
  const link = await api<{ redirect_url: string }>("/connected_accounts/link", {
    method: "POST",
    body: { auth_config_id: authConfigId, user_id: userId, callback_url: callbackUrl },
  });
  return link.redirect_url;
}

/** Runs one tool for one user (latest toolkit version). */
export async function executeTool(userId: string, slug: string, args: Record<string, unknown>) {
  return api<{ successful: boolean; data: unknown; error: string | null; log_id?: string }>(
    `/tools/execute/${encodeURIComponent(slug)}`,
    { method: "POST", body: { user_id: userId, arguments: args } },
  );
}

/** The first value under `key` anywhere in a nested result (tool outputs vary in shape). */
export function findKey(value: unknown, key: string, depth = 0): unknown {
  if (!value || typeof value !== "object" || depth > 6) return undefined;
  if (key in (value as Record<string, unknown>)) return (value as Record<string, unknown>)[key];
  for (const child of Object.values(value as Record<string, unknown>)) {
    const found = findKey(child, key, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

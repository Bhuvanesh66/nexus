
/** A JSON error with a message written for the person using the app (never a stack trace). */
export function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ code, message, ...extra }, { status, headers: { "cache-control": "no-store" } });
}

export const SIGNED_OUT = () => fail(401, "signed-out", "Your session ended. Sign in again to carry on.");

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

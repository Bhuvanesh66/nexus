import type { CSSProperties } from "react";

/** Typed inline custom properties: cssVars({ "--d": 400 }). Undefined values are dropped. */
export function cssVars(vars: Record<`--${string}`, string | number | undefined>): CSSProperties {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) out[key] = value;
  }
  return out as CSSProperties;
}

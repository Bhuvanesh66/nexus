
import { useEffect } from "react";

/** Closes the connect popup shortly after success; the action card notices the new connection on its own. */
export function CloseWhenDone() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.close(), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

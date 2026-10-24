---
name: Migration runtime compatibility
description: Why imported React apps need a runtime check even when their types pass.
---

Preserve the imported app's required React runtime capabilities, not just its TypeScript types.

**Why:** During this port, newer React types allowed the imported demo to pass typechecking against an older workspace React runtime, but the page crashed on a hook absent from that runtime.

**How to apply:** When changing runtime versions or workspace catalogs, check a rendered page that exercises the imported hooks. A passing typecheck alone is not evidence that the dependency versions are compatible.

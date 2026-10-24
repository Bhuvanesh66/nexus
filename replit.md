# Nexus — Beyond memory

Nexus captures notes, links and files into a private Vault, connects related fragments, and grounds task answers in those sources.

## Run & Operate

- Frontend workflow: `artifacts/second-brain: web`
- Backend workflow: `artifacts/api-server: API Server`
- Start/restart the managed workflows; they supply `PORT` and `BASE_PATH`. Do not run a root `pnpm dev`.
- `pnpm run typecheck` checks all workspace packages.
- `pnpm --filter @workspace/api-server run test:security` verifies URL ingestion's redirect, DNS rebinding and private-address protection.
- `pnpm --filter @workspace/second-brain run test:e2e` runs the imported desktop, phone and reduced-motion checks against the running shared proxy.
- Browser testing uses the Nix `chromium` package declared in `.replit`. Elsewhere, install Playwright Chromium with `pnpm --filter @workspace/second-brain run test:e2e:install`.

## Stack and layout

- React + Vite frontend in `artifacts/second-brain/`, served at `/`.
- Express backend in `artifacts/api-server/`, serving `/api` and `/auth`.
- Original business logic and Fetch API handlers live in `artifacts/api-server/src/nexus/`; Express binds each request to its own Supabase cookies.
- OpenAPI contract: `lib/api-spec/openapi.yaml`. Regenerate clients with `pnpm --filter @workspace/api-spec run codegen`.
- Supabase remains the existing database, Google authentication provider and private media store. Do not replace it with the unused scaffold database or migrate existing data as part of routine work.
- Original source and SQL migrations remain in `.migration-backup/` for reference; this directory is excluded from deployment.

## Configuration

No provider credentials were included in the import. The public landing page and interactive sample-data demo work without them. Sign-in explicitly explains the missing connection; authenticated endpoints reject signed-out requests.

Add these through Replit Secrets, never in source files:

- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the **existing** Supabase project. The original `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` names are also accepted server-side.
- Enable Google in Supabase Auth and allow this app's `/auth/callback` URL. Keep production and preview callback URLs separately configured.
- `GEMINI_API_KEY` for the original text, 1536-dimensional embeddings and transcription setup.
- Optional alternatives: `ANTHROPIC_API_KEY` for text; `OPENAI_API_KEY` for text and embeddings; `GROQ_API_KEY` for transcription.
- Optional `COMPOSIO_API_KEY` for user-approved Gmail/Calendar actions; `SUPADATA_API_KEY` for additional transcript/reel support.

Vercel's AI Gateway and deployment OIDC token are not used. Direct provider calls replace that platform-specific fallback. Do not switch an existing Vault's embedding model casually: vectors produced by different models cannot be compared.

All server-side link ingestion uses a public-only network transport: each redirect is validated and socket DNS lookup rejects private, metadata, reserved and IPv4-mapped/translation addresses. Keep that transport on article, social oEmbed and YouTube transcript fetches; never replace it with unrestricted `fetch`. Provider credentials must not follow cross-origin redirects.

The browser obtains only the public Supabase upload key from `/api/config`. Never expose a service-role key. Retain Supabase row-level security and existing per-user storage rules.

## Verification limits

The imported end-to-end suite covers the landing page, interactive demo, signed-out redirects and public stats. Real Google login, private Vault CRUD, media storage, AI calls and connected-app execution require the original service configuration and cannot be verified until it is supplied.

The phone demo pause check fails when clicking causes an automatic scroll/pause/resume transition. The identical test was run against the original Vercel site and fails there too; it is an inherited issue, not a port regression. Keep it visible rather than hiding or weakening the test.

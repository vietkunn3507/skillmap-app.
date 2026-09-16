# SkillMAP frontend

Existing Next.js / TypeScript application, with FastAPI market data and Better Auth + SQLite personal accounts.

See [revision notes](outputs/revision-notes.md) for setup, limitations, geographic provenance, demo credentials policy and reset instructions. See [original design inventory](outputs/implementation-notes.md) for the inspected design sources.

## Run (Node 24+)

```sh
pnpm install
# Copy .env.example to .env.local and set secure server secrets first.
pnpm auth:init
pnpm demo:seed
pnpm dev
```

FastAPI must be running at NEXT_PUBLIC_API_URL (default http://localhost:8000). For production use `pnpm build` and `pnpm start`. Set SMTP for real password recovery delivery. Local email mode saves private recovery links in `.data/mail-outbox`.

## Verify

`pnpm test`, `pnpm typecheck`, `pnpm build`; with the app running: `pnpm test:revision` and `node tests/demo-reset.mjs`. The integration suite registers isolated test accounts; avoid running repeatedly within the authentication rate-limit window. The reset test modifies and restores only the presentation account.

## Demo

Open http://localhost:3000/login and choose **Dùng tài khoản demo**. Seeded data represent Phương's fictional profile. Market statistics always come from FastAPI.

PowerShell reset: `$env:RESET_DEMO_DATA='true'`, `pnpm demo:reset`, then `Remove-Item Env:RESET_DEMO_DATA`.

## Mapi

`POST /api/mapi` uses the authenticated profile and server-fetched market evidence. Gemini is called through FastAPI `/api/ai/mapi`; the provider key remains in the backend environment. The pipeline plans retrieval, validates source IDs and checks numerical grounding. A provider failure returns an error, not a guided template answer. Configure `GEMINI_API_KEY` and `GEMINI_MODEL` in the backend `.env`.

## Phone presentation mode

Open `http://localhost:3000/present` for the centered phone experience, or append `?screen=/profile` or `?screen=/map`. Standard routes retain responsive browser behavior. See [phone presentation notes](outputs/phone-presentation-notes.md) for account behavior, CV preview, map changes and validation.

Browser checks: `node tests/phone-presentation.mjs` and `node tests/cv-preview.mjs`.

## Intelligence modules and submission scope

See `outputs/idea-feature-audit.md` for all 13 Idea modules, implemented methods and research limitations. New pages: `/organization`, `/investment`, `/transition`, `/intelligence`, `/transformation`. Market panels now include the full paired-year skill growth ranking. The backend needs both `main.py` and `intelligence.py` from `deploy/backend/`.

Transition uses Dijkstra over observed skill overlap; priority uses a disclosed rule-based score. Neither is a validated employability prediction. Task transformation uses Gemini qualitative analysis, not measured replacement percentages. CV analysis includes evidenced task/tool/language extraction.

Run `pnpm test` and `pnpm build`. Browser verification scripts are under `work/`; exported proof and the updated deployment ZIP are under `outputs/`. See `outputs/huong-dan-dua-skillmap-len-web.md` for Render setup. No local account database or .env is packaged.

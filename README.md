# isseis-commissions

Commissioning store for digital art from the artist, isseimx, with a Nier Automata-inspired product flow.

## Stack i'm working with

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express (REST API)
- Database/Auth: Supabase (Postgres + Supabase Auth for the admin console)
- Storage: Supabase Storage (commission file uploads)
- Emailing: Resend (verification codes, tracking/status email notifications)
- Payments: Ko-fi (buyers pay on the artist's Ko-fi, the admin marks it paid)
- Hosting target: Vercel (frontend), Railway or Render (backend)

## Install

```bash
npm install --prefix client
npm install --prefix server
```

Then copy the env examples and fill them in:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

The database schema lives in `supabase/migrations/`. Run it once in the Supabase SQL editor.

## Run Locally

From repository root:

```bash
npm run dev:server
```

In another terminal:

```bash
npm run dev:client
```

Default URLs:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:4000`
- Health check: `GET http://localhost:4000/api/health`

## Running Tests

All from `server/`:

| Command | What it tests | Needs |
|---|---|---|
| `npm test` | Unit tests: status rules, image checks, price formatting | Nothing. This is what CI runs. |
| `npm run test:e2e` | Public API: verification codes, submitting, idempotency, rate limits, status page | The API running in another terminal (`npm run dev`) |
| `npm run test:e2e:admin` | Admin API: login, approve/reject/paid/expire/complete, final uploads | Nothing. Starts its own API on port 4100. |

The e2e tests run against the real Supabase project in `server/.env`. They use `@example.com` addresses and delete everything they create. Resend errors about `example.com` in the output are expected.

Client checks (same as CI): `cd client && npm run lint && npx tsc --noEmit -p . && npm run build`

## API Endpoints

Public:

- `POST /api/verify` sends a 6-digit email code
- `POST /api/commissions` submits a request (multipart, up to 5 reference images, needs the code and an `Idempotency-Key` header)
- `GET /api/commissions/:id` gets status by tracking ID (never returns the email)
- `GET /api/commissions/:id/download` gets fresh download links once completed

Admin (`Authorization: Bearer <supabase access token>`, email must be in `ADMIN_EMAILS`):

- `GET /api/admin/commissions` and `GET /api/admin/commissions/:id`
- `PATCH /api/admin/commissions/:id/approve | reject | mark-paid | expire | complete`
- `POST /api/admin/commissions/:id/files` and `DELETE /api/admin/commissions/:id/files/:fileId` for final art

## Notes

- Statuses: `pending_review` → `awaiting_payment` → `in_progress` → `completed`, or `cancelled` (with a reason).
- Every status change is a conditional update, so double clicks and stale tabs get a 409 instead of applying twice.
- CI (GitHub Actions) runs the unit tests and the client lint/typecheck/build on every push to `main`.

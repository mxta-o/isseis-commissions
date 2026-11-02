# isseis-commissions

Commissioning store for digital art from the artist, isseimx, with a Nier Automata-inspired product flow.

## Stack i'm working with

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express (REST API)
- Database/Auth: Supabase (Postgres + admin JWT)
- Storage: Supabase Storage (commission file uploads)
- Emailing: Resend (tracking/status email notifications)
- Hosting target: Vercel (frontend), Railway or Render (backend)

## Install

Dependencies are already installed for `frontend` and `backend`.

If you need to reinstall:

```bash
npm install --prefix frontend
npm install --prefix backend
```

## Run Locally

From repository root:

```bash
npm run dev:backend
```

In another terminal:

```bash
npm run dev:frontend
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `GET http://localhost:4000/api/health`

## API Endpoints (Scaffold)

- `POST /api/commissions`
	- multipart form fields: `email`, `description`
	- optional files field: `files` (max 5, each max 10 MB)
	- returns `trackingId`
- `GET /api/commissions/:trackingId`
	- fetch commission status
- `PATCH /api/commissions/:trackingId/status`
	- admin only (`Authorization: Bearer <jwt>`)
	- updates status to `approved`, `rejected`, `in_progress`, or `completed`

## Notes

- Supabase and Resend integrations are wired as ready-to-configure modules.
- If Supabase is not configured yet, the scaffold still runs and keeps status data in-memory.
- Current admin auth middleware verifies JWTs using `ADMIN_JWT_SECRET`.

- streak commit

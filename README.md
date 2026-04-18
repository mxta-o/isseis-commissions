# isseis-commissions

Commissioning store for digital art from isseimx, with a Nier-inspired product flow.

## Stack

- Frontend: React + Vite + Tailwind CSS (v4)
- Backend: Node.js + Express (REST API)
- Database/Auth: Supabase (Postgres + admin JWT)
- Storage: Supabase Storage (commission file uploads)
- Email: Resend (tracking/status email notifications)
- Hosting target: Vercel (frontend), Railway/Render (backend)

## File Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js
│   │   ├── lib/
│   │   │   ├── resend.js
│   │   │   └── supabase.js
│   │   ├── middleware/
│   │   │   └── requireAdmin.js
│   │   ├── routes/
│   │   │   ├── commissions.js
│   │   │   └── health.js
│   │   ├── services/
│   │   │   └── commissionService.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Install

Dependencies are already installed for `frontend` and `backend`.

If you need to reinstall:

```bash
npm install --prefix frontend
npm install --prefix backend
```

## Environment Variables

Create env files from the examples:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

`backend/.env` includes:

- `PORT`
- `CLIENT_URL`
- `ADMIN_JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

`frontend/.env` includes:

- `VITE_API_URL`

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

# isseis-commissions

**Live:** https://isseiscommissions.com

Commissioning store for digital art from the artist, isseimx, with a Nier Automata-inspired product flow.

> Fan project. Not affiliated with or endorsed by Square Enix or PlatinumGames. All UI code, fonts and artwork used here are original or openly licensed.

## Tech stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express (REST API)
- **Database & auth:** Supabase (Postgres, Supabase Auth for the admin console)
- **File storage:** Supabase Storage (private bucket, signed download links)
- **Email:** Resend (verification codes and status updates)
- **Payments:** Ko-fi (buyers pay on the artist's Ko-fi, the admin marks it paid)
- **Hosting:** Cloudflare Pages (frontend), Render (backend)

## Running locally

```bash
npm install --prefix client
npm install --prefix server

cp client/.env.example client/.env
cp server/.env.example server/.env
```

Fill in both `.env` files, then run the schema in `supabase/migrations/` once in the Supabase SQL editor.

```bash
npm run dev:server   # API on http://localhost:4000
npm run dev:client   # site on http://localhost:3001 (in a second terminal)
```

## License

The code is under the license in [LICENSE](LICENSE). The artwork and photos in `client/src/assets/` belong to the artist and are not covered by it; they may not be reused without permission.

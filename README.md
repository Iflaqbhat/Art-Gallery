# Canvaso

Canvaso now uses a React frontend, a Node.js/Express API, PostgreSQL, and Clerk authentication. The old `supabase/` directory is retained only as migration reference; the running application no longer imports the Supabase SDK.

## Setup

1. Create a PostgreSQL database.
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL`.
3. Create a Clerk application, enable the OAuth providers you want, and copy its publishable and secret keys into the frontend and server environment files.
4. Put your Clerk user ID in `ADMIN_USER_IDS` or a trusted email in `ADMIN_EMAILS` to bootstrap curator access.
5. Run the migration and start both processes.

```sh
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env
npm run db:migrate
npm run dev:api
npm run dev:frontend
```

Frontend: `http://localhost:8082`

API: `http://localhost:4000/api`

## Environment

Frontend requires:

```env
VITE_API_URL=http://localhost:4000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Backend requires `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and either `ADMIN_USER_IDS` or `ADMIN_EMAILS`. Set `DATABASE_SSL=true` for hosted providers that require TLS.

## Media

Development uploads are stored in `server/uploads` and served by the API. Database rows store ordinary URLs, so this can later be replaced with S3, Cloudinary, or another object store without changing the gallery schema.

## Deployment

The included `render.yaml` deploys the frontend and API together as one Render Web Service. In Render, select **New > Blueprint**, choose this repository, and provide the prompted Neon and Clerk values. The frontend is built with `VITE_API_URL=/api`, so it shares the service domain with the API and does not need a separate CORS configuration. Add the deployed Render domain in Clerk before signing in.

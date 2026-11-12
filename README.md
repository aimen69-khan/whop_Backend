# Summit Roofing Backend

Express backend for the supplied Summit Roofing React/Vite frontend.

## What it provides

- `GET /api/health` health check
- `GET /api/services` service list
- `GET /api/plans` pricing/plan metadata
- `POST /api/leads` estimate/contact form submission
- `GET /api/admin/leads` protected lead list
- `GET /api/admin/leads/:id` protected lead lookup
- `PATCH /api/admin/leads/:id` protected lead status update
- CORS configuration for local/Vercel frontends
- Helmet security headers
- JSON body validation
- Rate limiting
- No database

Leads are persisted in `data/leads.json`. This is deliberately file-based and is **not a database**. It works well for local development or a persistent Node server. On serverless platforms such as Vercel, local filesystem writes are not durable across invocations, so use a persistent storage provider if you later need production lead persistence.

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

API runs at `http://localhost:4000`.

## Frontend connection

In the frontend `.env`:

```env
VITE_API_URL=http://localhost:4000
```

For a deployed frontend:

```env
VITE_API_URL=https://YOUR-BACKEND.vercel.app
```

Then rebuild/redeploy the frontend.

## Admin API

Set `ADMIN_API_KEY` in the backend `.env`. Send it as:

```text
x-admin-key: YOUR_KEY
```

Example PowerShell:

```powershell
curl.exe http://localhost:4000/api/admin/leads -H "x-admin-key: YOUR_KEY"
```

## Whop

The existing frontend checkout remains Whop Elements-based. The backend intentionally does not expose a Whop secret key to the browser. If you later add server-side Whop operations, keep the Whop API key in backend environment variables only.

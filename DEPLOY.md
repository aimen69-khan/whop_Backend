# Deployment notes

## Render/Railway/Fly/Node VPS

This backend is a normal long-running Express server. Set:

- `PORT` (usually supplied by the platform)
- `CORS_ORIGINS=https://your-frontend-domain.vercel.app`
- `ADMIN_API_KEY=...`

The `data/leads.json` file must live on persistent disk if you need leads to survive restarts.

## Vercel

You can deploy an Express API to Vercel, but **do not rely on `data/leads.json` for durable production storage** because serverless filesystem writes are not a permanent database. The API endpoints still work for testing, but use a persistent storage service for production leads.

If the frontend and backend are separate deployments, the frontend must use `VITE_API_URL` and the backend must include the exact frontend origin in `CORS_ORIGINS`.

Example:

```env
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
```

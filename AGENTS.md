# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Bariqe Al-Tamyoz is a multi-service Node.js/TypeScript codebase with three primary dev services:

| Service | Dir | Port | Dev command |
|---|---|---|---|
| Backend API (Express) | `backend/` | 8080 | `npm run dev` |
| Dashboard (Vite+React) | `frontend/` | 5173 | `npm run dev` |
| Public Website (Next.js) | `bariqe-website/` | 3000 | `npm run dev` |

The `bariqe-dashboard/` directory is a deployment copy of `backend/` + `frontend/` (with Dockerfiles); for development, use the top-level `backend/` and `frontend/` directories.

### Running services

1. **MongoDB** must be running before starting the backend. Start with:
   ```
   mongod --dbpath /data/db --logpath /tmp/mongodb.log --fork
   ```
2. Start the backend first (frontends depend on it for API calls):
   ```
   cd /workspace/backend && npm run dev
   ```
3. Start frontends independently:
   ```
   cd /workspace/frontend && npm run dev
   cd /workspace/bariqe-website && npm run dev
   ```

### Environment files

Each service needs a `.env` file (not committed to git):

- **`backend/.env`**: requires `MONGO_URI`, `JWT`, `PORT` (default 8080), `NODE_ENV`, `SESSION_SECRET`. Cloudinary/Stripe/OAuth credentials are optional.
- **`frontend/.env`**: requires `VITE_API_BASE_URL` (default `http://localhost:8080`).
- **`bariqe-website/.env`**: requires `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080`).

### Gotchas

- The backend's `dotenv.config()` resolves `.env` from `__dirname` (i.e., `backend/.env`), not the working directory.
- In development mode (`NODE_ENV=development`), the backend does not exit on MongoDB connection failure — it logs a warning and continues, so you can start the backend even if MongoDB connects slowly.
- OAuth strategies (Google, Apple) only activate when their credentials are set in `.env`; they silently skip otherwise.
- The backend has a `lint` script in `package.json` but no ESLint config or dependency — only `frontend/` and `bariqe-website/` have working lint setups.
- Pre-existing lint errors exist in the codebase (mostly `@typescript-eslint/no-explicit-any`); these are not regressions.
- The admin user for the dashboard can be created via `cd backend && npx ts-node scripts/create-admin.ts "Name" "email" "password" "admin"`.
- Package manager is **npm** (all lockfiles are `package-lock.json`).

### Lint & type-check commands

- Backend: `cd backend && npm run build` (runs `tsc`)
- Frontend: `cd frontend && npm run lint` and `cd frontend && npx tsc -b --noEmit`
- Website: `cd bariqe-website && npm run lint`

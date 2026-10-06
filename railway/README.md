# Railway deployment

One Railway project, six services, all deployed from this repo:

| Service  | What                          | Image (pinned in its Dockerfile)          | Public domain |
| -------- | ----------------------------- | ----------------------------------------- | ------------- |
| `web`    | Next.js app (`/Dockerfile`)   | node:24-alpine                            | yes           |
| `db`     | Supabase Postgres + volume    | supabase/postgres:17.6.1.136              | no (TCP proxy optional) |
| `rest`   | PostgREST                     | postgrest/postgrest:v14.17                | no            |
| `kong`   | API gateway                   | kong/kong:3.9.3                           | yes — Studio login |
| `meta`   | postgres-meta (for Studio)    | supabase/postgres-meta:v0.99.0            | no            |
| `studio` | Supabase Studio               | supabase/studio:2026.09.07-sha-7996410    | no            |

```
internet ──► web ──(private)──► kong /rest/v1 ──► rest ──► db
internet ──► kong / (basic auth) ──► studio ──► meta ──► db
```

The app only uses PostgREST via the service-role key, so Supabase Auth,
Storage, Realtime, Edge Functions and analytics are deliberately left out.

> **Service names matter.** Variable references in `.railway/railway.ts` (`${{db.…}}`) and the
> Kong upstream defaults (`rest.railway.internal`, …) assume the services are
> named exactly as in the table.

## 1. Shared secrets

```sh
npm run keys:new
```

Paste the printed block into **Project Settings → Shared Variables → Raw
Editor**. Keep `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD` — that's the Studio login.

## 2. Apply the infrastructure

Services, Dockerfiles, watch paths, healthchecks, the `db` volume and every
service's variables are defined in [`/.railway/railway.ts`](../.railway/railway.ts)
(Railway Infrastructure as Code). Secrets are only referenced from it, via the
shared variables from step 1.

Needs Railway CLI 5.42.1+ and `npm install` (for the `railway` SDK). Then, from
the repo root:

```sh
railway link            # once: pick the project and environment
railway config plan     # review the diff
railway config apply
```

After the first apply, by hand in the Railway UI:

- **web**: set `DASHBOARD_PASSCODE`, `INGEST_BASIC_AUTH_USER` and
  `INGEST_BASIC_AUTH_PASS` under **Variables**. `railway.ts` keeps whatever is
  there (`preserve()`).
- **web**: **Settings → Networking → Generate Domain** (port 3000).
- **kong**: **Generate Domain** (port 8000).

Deploy order on first boot doesn't matter much, but `db` must be up before
`rest`/`meta` stop restarting.

Re-run `plan`/`apply` whenever `railway.ts` changes; pushing code alone does
not apply infrastructure changes.

### Moving existing services off `railway.toml`

The per-service `railway.toml` files are gone. Services that still point at
one under **Settings → Config-as-code** must be detached before IaC manages
them: clear that path on each service (or run `railway config migrate`) before
the first `apply`.

## 3. Migrations

The database starts empty (Supabase roles/schemas only). `web` runs
`npm run db:migrate` as its pre-deploy command, which applies any pending
`supabase/migrations` to `db` over the private network (`DATABASE_URL`). So
pushing a new migration redeploys `web` and applies it. If a migration fails,
the deploy is aborted and the previous version keeps serving.

To apply them by hand instead (e.g. with `--include-seed` to run
`supabase/seed.sql`):

1. **db → Settings → Networking → TCP Proxy** on port `5432`. Note the
   `host:port` Railway gives you.
2. Run:

   ```sh
   npx supabase db push --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@<host>:<port>/postgres"
   ```

3. Optionally remove the TCP proxy again.

## Notes

- `db/init/*.sql` only run when the volume is empty. Changing
  `POSTGRES_PASSWORD` later won't update the roles; do that with `ALTER USER`
  (see `db/init/99-roles.sql`).
- Studio's saved SQL snippets live in the container and are lost on redeploy.
- Studio has no auth of its own — never give the `studio` service a public
  domain; always go through `kong`.
- Upgrading images: bump the tags in the Dockerfiles to match
  `supabase/docker/docker-compose.yml` upstream.

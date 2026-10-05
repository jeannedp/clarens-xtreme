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

> **Service names matter.** Variable references below (`${{db.…}}`) and the
> Kong upstream defaults (`rest.railway.internal`, …) assume the services are
> named exactly as in the table.

## 1. Shared secrets

```sh
npm run keys:new
```

Paste the printed block into **Project Settings → Shared Variables → Raw
Editor**. Keep `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD` — that's the Studio login.

## 2. Create the services

For each service: **New → GitHub Repo → this repo**, rename it, then in
**Settings → Config-as-code** set the Railway config file to
`/railway/<service>/railway.toml`. That file selects the Dockerfile, the watch
paths and the healthcheck. Then paste its variables (step 3) into
**Variables → Raw Editor**.

Extra per-service settings:

- **db**: attach a **Volume** mounted at `/var/lib/postgresql/data`.
- **web**: **Settings → Networking → Generate Domain** (port 3000).
- **kong**: **Generate Domain** (port 8000).

Deploy order on first boot doesn't matter much, but `db` must be up before
`rest`/`meta` stop restarting.

## 3. Variables per service

Everything non-secret is baked into the Dockerfiles; only secrets and
cross-service references live in Railway.

**db**
```env
POSTGRES_PASSWORD=${{shared.POSTGRES_PASSWORD}}
PGPASSWORD=${{shared.POSTGRES_PASSWORD}}
```

**rest**
```env
PGRST_DB_URI=postgres://authenticator:${{shared.POSTGRES_PASSWORD}}@${{db.RAILWAY_PRIVATE_DOMAIN}}:5432/postgres
PGRST_JWT_SECRET=${{shared.JWT_SECRET}}
```

**meta**
```env
PG_META_DB_HOST=${{db.RAILWAY_PRIVATE_DOMAIN}}
PG_META_DB_PASSWORD=${{shared.POSTGRES_PASSWORD}}
CRYPTO_KEY=${{shared.PG_META_CRYPTO_KEY}}
```

**studio**
```env
POSTGRES_HOST=${{db.RAILWAY_PRIVATE_DOMAIN}}
POSTGRES_PASSWORD=${{shared.POSTGRES_PASSWORD}}
PG_META_CRYPTO_KEY=${{shared.PG_META_CRYPTO_KEY}}
STUDIO_PG_META_URL=http://${{meta.RAILWAY_PRIVATE_DOMAIN}}:8080
SUPABASE_URL=http://${{kong.RAILWAY_PRIVATE_DOMAIN}}:8000
SUPABASE_PUBLIC_URL=https://${{kong.RAILWAY_PUBLIC_DOMAIN}}
SUPABASE_ANON_KEY=${{shared.ANON_KEY}}
SUPABASE_SERVICE_KEY=${{shared.SERVICE_ROLE_KEY}}
AUTH_JWT_SECRET=${{shared.JWT_SECRET}}
```

**kong**
```env
SUPABASE_ANON_KEY=${{shared.ANON_KEY}}
SUPABASE_SERVICE_KEY=${{shared.SERVICE_ROLE_KEY}}
DASHBOARD_USERNAME=${{shared.DASHBOARD_USERNAME}}
DASHBOARD_PASSWORD=${{shared.DASHBOARD_PASSWORD}}
```

**web**
```env
PORT=3000
SUPABASE_URL=http://${{kong.RAILWAY_PRIVATE_DOMAIN}}:8000
SUPABASE_SERVICE_ROLE_KEY=${{shared.SERVICE_ROLE_KEY}}
DASHBOARD_PASSCODE=<choose one>
INGEST_BASIC_AUTH_USER=<choose one>
INGEST_BASIC_AUTH_PASS=<choose one>
```

## 4. Apply migrations

The database starts empty (Supabase roles/schemas only). Push this repo's
`supabase/migrations` from your machine:

1. **db → Settings → Networking → TCP Proxy** on port `5432`. Note the
   `host:port` Railway gives you.
2. Run:

   ```sh
   npx supabase db push --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@<host>:<port>/postgres"
   ```

   Add `--include-seed` to also run `supabase/seed.sql`.
3. Optionally remove the TCP proxy again. Re-run step 2 whenever new
   migrations are added.

## Notes

- `db/init/*.sql` only run when the volume is empty. Changing
  `POSTGRES_PASSWORD` later won't update the roles; do that with `ALTER USER`
  (see `db/init/99-roles.sql`).
- Studio's saved SQL snippets live in the container and are lost on redeploy.
- Studio has no auth of its own — never give the `studio` service a public
  domain; always go through `kong`.
- Upgrading images: bump the tags in the Dockerfiles to match
  `supabase/docker/docker-compose.yml` upstream.

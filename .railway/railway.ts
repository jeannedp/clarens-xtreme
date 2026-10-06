// Railway infrastructure for this repo. See railway/README.md.
//
//   railway config plan    # diff against the linked environment
//   railway config apply   # apply it
//
// Secrets live in the project's shared variables (`npm run keys:new`) and are
// only referenced here. Values containing `${{…}}` are Railway reference
// templates, resolved by Railway at deploy time.
import {
  defineRailway,
  github,
  preserve,
  project,
  service,
  volume,
  type DeployConfig,
  type ServiceConfigInput,
} from "railway/iac";

const repo = github("jeannedp/clarens-xtreme", { branch: "main" });

const restartPolicy: DeployConfig = {
  restartPolicyType: "ON_FAILURE",
  restartPolicyMaxRetries: 10,
};

/** A service built from `railway/<name>/Dockerfile`, redeployed on changes under that folder. */
function supabaseService(name: string) {
  return {
    source: repo,
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: `railway/${name}/Dockerfile`,
      watchPatterns: [`/railway/${name}/**`],
    },
    deploy: restartPolicy,
  } satisfies ServiceConfigInput;
}

export default defineRailway((ctx) => {
  const { shared } = ctx;

  // Supabase Postgres. Init scripts in railway/db/init only run on an empty volume.
  const dbData = volume("db-data");
  const db = service("db", {
    ...supabaseService("db"),
    volumeMounts: { "/var/lib/postgresql/data": dbData },
    env: {
      POSTGRES_PASSWORD: shared.POSTGRES_PASSWORD,
      PGPASSWORD: shared.POSTGRES_PASSWORD,
    },
  });

  // PostgREST.
  const rest = service("rest", {
    ...supabaseService("rest"),
    env: {
      PGRST_DB_URI: "postgres://authenticator:${{shared.POSTGRES_PASSWORD}}@${{db.RAILWAY_PRIVATE_DOMAIN}}:5432/postgres",
      PGRST_JWT_SECRET: shared.JWT_SECRET,
    },
  });

  // postgres-meta (for Studio).
  const meta = service("meta", {
    ...supabaseService("meta"),
    env: {
      PG_META_DB_HOST: db.env.RAILWAY_PRIVATE_DOMAIN,
      PG_META_DB_PASSWORD: shared.POSTGRES_PASSWORD,
      CRYPTO_KEY: shared.PG_META_CRYPTO_KEY,
    },
  });

  // API gateway: /rest/v1 for the app, basic-auth Studio on /.
  // Its public domain is generated in the Railway UI (port 8000).
  const kong = service("kong", {
    ...supabaseService("kong"),
    env: {
      SUPABASE_ANON_KEY: shared.ANON_KEY,
      SUPABASE_SERVICE_KEY: shared.SERVICE_ROLE_KEY,
      DASHBOARD_USERNAME: shared.DASHBOARD_USERNAME,
      DASHBOARD_PASSWORD: shared.DASHBOARD_PASSWORD,
    },
  });

  // Supabase Studio. Never give it a public domain; it's reached through kong.
  const studio = service("studio", {
    ...supabaseService("studio"),
    healthcheck: "/api/platform/profile",
    healthcheckTimeout: 120,
    env: {
      POSTGRES_HOST: db.env.RAILWAY_PRIVATE_DOMAIN,
      POSTGRES_PASSWORD: shared.POSTGRES_PASSWORD,
      PG_META_CRYPTO_KEY: shared.PG_META_CRYPTO_KEY,
      STUDIO_PG_META_URL: "http://${{meta.RAILWAY_PRIVATE_DOMAIN}}:8080",
      SUPABASE_URL: "http://${{kong.RAILWAY_PRIVATE_DOMAIN}}:8000",
      SUPABASE_PUBLIC_URL: "https://${{kong.RAILWAY_PUBLIC_DOMAIN}}",
      SUPABASE_ANON_KEY: shared.ANON_KEY,
      SUPABASE_SERVICE_KEY: shared.SERVICE_ROLE_KEY,
      AUTH_JWT_SECRET: shared.JWT_SECRET,
    },
  });

  // Next.js app (root Dockerfile). Its public domain is generated in the
  // Railway UI (port 3000).
  const web = service("web", {
    source: repo,
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
      watchPatterns: [
        "/src/**",
        "/public/**",
        "/package.json",
        "/package-lock.json",
        "/next.config.ts",
        "/tsconfig.json",
        "/postcss.config.mjs",
        "/components.json",
        "/Dockerfile",
        "/supabase/config.toml",
        "/supabase/migrations/**",
      ],
    },
    // Applies pending supabase/migrations to `db` before the new version goes
    // live. If it fails, the deploy is aborted and the previous version keeps
    // serving.
    healthcheck: "/api/health-check",
    healthcheckTimeout: 120,
    deploy: restartPolicy,
    env: {
      PORT: "3000",
      SUPABASE_URL: "http://${{kong.RAILWAY_PRIVATE_DOMAIN}}:8000",
      SUPABASE_SERVICE_ROLE_KEY: shared.SERVICE_ROLE_KEY,
      DATABASE_URL: "postgresql://postgres:${{shared.POSTGRES_PASSWORD}}@${{db.RAILWAY_PRIVATE_DOMAIN}}:5432/postgres",
      // Chosen per environment in the Railway UI; kept as-is on apply.
      DASHBOARD_PASSCODE: preserve(),
      INGEST_BASIC_AUTH_USER: preserve(),
      INGEST_BASIC_AUTH_PASS: preserve(),
    },
  });

  return project(ctx.projectName ?? "clarens-xtreme", {
    resources: [dbData, db, rest, meta, kong, studio, web],
  });
});

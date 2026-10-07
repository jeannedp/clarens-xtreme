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

  const dbData = volume("db-data");
  const db = service("db", {
    ...supabaseService("db"),
    volumeMounts: { "/var/lib/postgresql/data": dbData },
    env: {
      POSTGRES_PASSWORD: shared.POSTGRES_PASSWORD,
      PGPASSWORD: shared.POSTGRES_PASSWORD,
    },
  });

  const rest = service("rest", {
    ...supabaseService("rest"),
    env: {
      PGRST_DB_URI: "postgres://authenticator:${{shared.POSTGRES_PASSWORD}}@${{db.RAILWAY_PRIVATE_DOMAIN}}:5432/postgres",
      PGRST_JWT_SECRET: shared.JWT_SECRET,
    },
  });

  const meta = service("meta", {
    ...supabaseService("meta"),
    env: {
      PG_META_DB_HOST: db.env.RAILWAY_PRIVATE_DOMAIN,
      PG_META_DB_PASSWORD: shared.POSTGRES_PASSWORD,
      CRYPTO_KEY: shared.PG_META_CRYPTO_KEY,
    },
  });

  const kong = service("kong", {
    ...supabaseService("kong"),
    env: {
      SUPABASE_ANON_KEY: shared.ANON_KEY,
      SUPABASE_SERVICE_KEY: shared.SERVICE_ROLE_KEY,
      DASHBOARD_USERNAME: shared.DASHBOARD_USERNAME,
      DASHBOARD_PASSWORD: shared.DASHBOARD_PASSWORD,
    },
  });

  const studio = service("studio", {
    ...supabaseService("studio"),
    healthcheck: "/api/platform/profile",
    healthcheckTimeout: 120,
    env: {
      PORT: "3000",
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
    preDeploy: "npm run db:migrate",
    healthcheck: "/api/health-check",
    healthcheckTimeout: 120,
    deploy: restartPolicy,
    env: {
      PORT: "3000",
      SUPABASE_URL: "http://${{kong.RAILWAY_PRIVATE_DOMAIN}}:8000",
      SUPABASE_SERVICE_ROLE_KEY: shared.SERVICE_ROLE_KEY,
      DATABASE_URL: "postgresql://postgres:${{shared.POSTGRES_PASSWORD}}@${{db.RAILWAY_PRIVATE_DOMAIN}}:5432/postgres",
      
      DASHBOARD_PASSCODE: preserve(),
      INGEST_BASIC_AUTH_USER: preserve(),
      INGEST_BASIC_AUTH_PASS: preserve(),
    },
  });

  return project(ctx.projectName ?? "osiris-technical-systems", {
    resources: [dbData, db, rest, meta, kong, studio, web],
  });
});

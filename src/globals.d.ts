declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';

      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      DASHBOARD_PASSCODE: string;
      
      INGEST_BASIC_AUTH_USER: string;
      INGEST_BASIC_AUTH_PASS: string;
    }
  }
}

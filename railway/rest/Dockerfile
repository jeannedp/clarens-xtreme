# PostgREST. Mirrors the `rest` service of supabase/docker.
FROM postgrest/postgrest:v14.17

# "*" binds IPv4 and IPv6 — Railway's private network may be IPv6-only.
ENV PGRST_SERVER_HOST="*" \
    PGRST_SERVER_PORT=3000 \
    PGRST_DB_SCHEMAS=public,graphql_public \
    PGRST_DB_EXTRA_SEARCH_PATH=public \
    PGRST_DB_MAX_ROWS=1000 \
    PGRST_DB_ANON_ROLE=anon \
    PGRST_DB_USE_LEGACY_GUCS=false \
    PGRST_APP_SETTINGS_JWT_EXP=3600

EXPOSE 3000

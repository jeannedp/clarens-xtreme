# Supabase Studio. Mirrors the `studio` service of supabase/docker.
# Not exposed publicly — reached through kong, which puts basic auth in front.
FROM supabase/studio:2026.09.07-sha-7996410

ENV HOSTNAME="::" \
    PORT=3000 \
    POSTGRES_PORT=5432 \
    POSTGRES_DB=postgres \
    POSTGRES_USER_READ_WRITE=postgres \
    PGRST_DB_SCHEMAS=public,graphql_public \
    PGRST_DB_EXTRA_SEARCH_PATH=public \
    PGRST_DB_MAX_ROWS=1000 \
    DEFAULT_ORGANIZATION_NAME="Clarens Xtreme" \
    DEFAULT_PROJECT_NAME="Clarens Xtreme" \
    ENABLED_FEATURES_LOGS_ALL=false \
    SNIPPETS_MANAGEMENT_FOLDER=/app/snippets

EXPOSE 3000

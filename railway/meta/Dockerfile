# postgres-meta (backs Studio). Mirrors the `meta` service of supabase/docker.
FROM supabase/postgres-meta:v0.99.0

ENV PG_META_HOST="::" \
    PG_META_PORT=8080 \
    PG_META_DB_PORT=5432 \
    PG_META_DB_NAME=postgres \
    PG_META_DB_USER=postgres

EXPOSE 8080

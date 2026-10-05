# Self-signed cert so connections through Railway's public TCP proxy (used for
# `supabase db push`) are encrypted. The Supabase CLI refuses non-TLS servers,
# and the postgres image has no openssl, so it's generated in its own stage.
FROM alpine:3 AS cert
RUN apk add --no-cache openssl \
 && openssl req -new -x509 -nodes -days 3650 -subj "/CN=db" \
      -keyout /server.key -out /server.crt

# ------------------------------

# Supabase Postgres. Mirrors the `db` service of supabase/docker, minus the
# realtime/logs/pooler/analytics init scripts this project doesn't use.
FROM supabase/postgres:17.6.1.136

COPY railway/db/init/ /docker-entrypoint-initdb.d/init-scripts/
COPY --from=cert --chown=postgres:postgres --chmod=600 /server.key /server.crt /etc/postgresql/

# Railway mounts the volume at /var/lib/postgresql/data, and the mount point
# contains lost+found, which initdb refuses. Keep the cluster in a subdirectory.
# postgresql.conf hard-codes data_directory, so it's overridden in CMD as well.
ENV PGDATA=/var/lib/postgresql/data/pgdata \
    POSTGRES_HOST=/var/run/postgresql \
    PGPORT=5432 \
    POSTGRES_PORT=5432 \
    PGDATABASE=postgres \
    POSTGRES_DB=postgres \
    JWT_EXP=3600

EXPOSE 5432

CMD [ "postgres", \
      "-c", "config_file=/etc/postgresql/postgresql.conf", \
      "-c", "data_directory=/var/lib/postgresql/data/pgdata", \
      "-c", "ssl=on", \
      "-c", "ssl_cert_file=/etc/postgresql/server.crt", \
      "-c", "ssl_key_file=/etc/postgresql/server.key", \
      "-c", "log_min_messages=fatal" ]

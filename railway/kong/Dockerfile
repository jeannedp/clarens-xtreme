# Kong API gateway. Mirrors supabase/docker's docker-compose.kong.yml override.
# Public entry point for Studio (basic auth) and the private /rest/v1 gateway
# the web app talks to.
FROM kong/kong:3.9.3

COPY railway/kong/kong.yml /home/kong/temp.yml
COPY railway/kong/kong-entrypoint.sh /home/kong/kong-entrypoint.sh

# Upstreams default to Railway's private hostnames for services named
# rest/meta/studio; override via variables if the services are named otherwise.
# AAAA is in the DNS order because Railway's private network may be IPv6-only.
ENV KONG_DATABASE=off \
    KONG_DECLARATIVE_CONFIG=/usr/local/kong/kong.yml \
    KONG_PROXY_LISTEN="0.0.0.0:8000, [::]:8000" \
    KONG_DNS_ORDER=LAST,A,AAAA,CNAME \
    KONG_DNS_NOT_FOUND_TTL=1 \
    KONG_DNS_VALID_TTL=5 \
    KONG_PLUGINS=cors,key-auth,acl,basic-auth \
    KONG_NGINX_PROXY_PROXY_BUFFER_SIZE=160k \
    KONG_NGINX_PROXY_PROXY_BUFFERS="64 160k" \
    KONG_PROXY_ACCESS_LOG="/dev/stdout combined" \
    PORT=8000 \
    REST_UPSTREAM=http://rest.railway.internal:3000/ \
    META_UPSTREAM=http://meta.railway.internal:8080/ \
    STUDIO_UPSTREAM=http://studio.railway.internal:3000/

EXPOSE 8000

ENTRYPOINT [ "/bin/sh", "/home/kong/kong-entrypoint.sh" ]

# Local Postgres for the Tristaravel web app.
# Built on the official Postgres image; the schema in ./init is baked in and
# runs automatically on first startup (empty data directory).
FROM postgres:16-alpine

# Copied into the init directory so Postgres runs it on first boot.
COPY init/ /docker-entrypoint-initdb.d/

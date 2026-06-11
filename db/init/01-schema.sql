-- Schema for the Tristaravel web app's local Postgres database.
--
-- This file runs automatically the first time the postgres container starts
-- (Postgres executes everything in /docker-entrypoint-initdb.d/ on an empty
-- data directory). It is also written to be fully idempotent so it can be
-- piped into an already-running database as a migration:
--   docker exec -i tristaravel-db psql -U postgres -d anything < db/init/01-schema.sql
-- To reset from scratch instead: `docker compose down -v && docker compose up -d`.

-- ── Leads (public "Get Quote" submissions) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pickup      text        NOT NULL,
  dropoff     text        NOT NULL,
  car_type    text        NOT NULL,
  distance    numeric,                 -- road distance in km (nullable: Traveller = custom)
  price       integer,                 -- estimated fare in INR (nullable for custom pricing)
  full_name   text        NOT NULL,
  email       text,                    -- optional
  phone       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Helpful for listing the newest quote requests first.
CREATE INDEX IF NOT EXISTS quotes_created_at_idx ON quotes (created_at DESC);

-- ── Drivers (admin-seeded accounts for the /driver portal) ──────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  phone         text,
  password_hash text        NOT NULL,  -- argon2 hash
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Server-side sessions for drivers (cookie token -> driver).
CREATE TABLE IF NOT EXISTS driver_sessions (
  token      text        PRIMARY KEY,
  driver_id  bigint      NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS driver_sessions_driver_id_idx ON driver_sessions (driver_id);

-- ── Lead lifecycle columns (added to quotes) ────────────────────────────────
-- status flow: new -> pending (auto after 1h) -> confirmed (driver picks); any -> cancelled.
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS status             text        NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS assigned_driver_id bigint      REFERENCES drivers(id),
  ADD COLUMN IF NOT EXISTS picked_at          timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at       timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- Constrain status to the known set (drop-then-add so it's safe to re-run).
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_chk;
ALTER TABLE quotes
  ADD CONSTRAINT quotes_status_chk
  CHECK (status IN ('new', 'pending', 'confirmed', 'cancelled'));

CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes (status);

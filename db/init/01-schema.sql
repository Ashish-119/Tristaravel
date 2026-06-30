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

-- ── One-way trip details + fare range (added to quotes) ─────────────────────
-- The one-way form now collects a travel date/time and shows a fare *range*
-- (min in `price`, max in `price_max`), mirroring the round-trip estimate.
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS travel_date date,    -- date of travel
  ADD COLUMN IF NOT EXISTS pickup_time text,    -- e.g. '09:00'
  ADD COLUMN IF NOT EXISTS price_max   integer; -- upper bound of fare range in INR (nullable: custom)

-- ── "Trip Advised" flag (added to quotes) ───────────────────────────────────
-- TRUE when the lead originated from the public "Plan Your Trip" page (the
-- destination carousels) rather than the plain home-page booking form. Lets
-- the driver portal flag travellers who were nudged by an advised itinerary.
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS trip_advised boolean NOT NULL DEFAULT false;



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

-- ── Round-trip leads (separate "Get Quote" submissions) ─────────────────────
-- Round trips are stored in their own table rather than `quotes` because they
-- carry extra fields the one-way flow doesn't have: `num_days` (trip length)
-- and `pricing_basis` (how the fare range was derived). Everything else mirrors
-- `quotes` so the driver portal can treat both lead types uniformly.
-- Defined after `drivers` because `assigned_driver_id` references it.
CREATE TABLE IF NOT EXISTS round_trip_quotes (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pickup             text        NOT NULL,
  dropoff            text        NOT NULL,
  car_type           text        NOT NULL,
  travel_date        date,                    -- date of travel
  pickup_time        text,                    -- e.g. '09:00'
  num_days           integer,                 -- length of the round trip in days
  distance           numeric,                 -- road distance in km (nullable: custom)
  price              integer,                 -- lower bound of fare range in INR (nullable: custom)
  price_max          integer,                 -- upper bound of fare range in INR (nullable: custom)
  pricing_basis      text,                    -- how the estimate was derived (e.g. 'custom')
  full_name          text        NOT NULL,
  email              text,                    -- optional
  phone              text        NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- Lead lifecycle, mirroring `quotes`:
  status             text        NOT NULL DEFAULT 'new',
  assigned_driver_id bigint      REFERENCES drivers(id),
  picked_at          timestamptz,
  cancelled_at       timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- "Trip Advised" flag — TRUE when the round trip came from the "Plan Your Trip"
-- destination carousels (mirrors the same column on `quotes`).
ALTER TABLE round_trip_quotes
  ADD COLUMN IF NOT EXISTS trip_advised boolean NOT NULL DEFAULT false;

-- Constrain status to the known set (drop-then-add so it's safe to re-run).
ALTER TABLE round_trip_quotes DROP CONSTRAINT IF EXISTS round_trip_quotes_status_chk;
ALTER TABLE round_trip_quotes
  ADD CONSTRAINT round_trip_quotes_status_chk
  CHECK (status IN ('new', 'pending', 'confirmed', 'cancelled'));

CREATE INDEX IF NOT EXISTS round_trip_quotes_created_at_idx ON round_trip_quotes (created_at DESC);
CREATE INDEX IF NOT EXISTS round_trip_quotes_status_idx ON round_trip_quotes (status);

-- 0001_init.sql — Pioneers' Guestbook initial schema

CREATE TABLE IF NOT EXISTS visitors (
  id            TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,
  city          TEXT,
  country       TEXT,
  country_code  TEXT CHECK (country_code IS NULL OR length(country_code) = 2),
  lat           REAL CHECK (lat IS NULL OR (lat BETWEEN -90 AND 90)),
  lon           REAL CHECK (lon IS NULL OR (lon BETWEEN -180 AND 180))
);

CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_country    ON visitors(country) WHERE country IS NOT NULL;

CREATE TABLE IF NOT EXISTS notes (
  id            TEXT PRIMARY KEY,
  visitor_id    TEXT REFERENCES visitors(id) ON DELETE SET NULL,
  created_at    INTEGER NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 0 AND 5),
  body          TEXT CHECK (body IS NULL OR length(body) <= 400),
  display_name  TEXT NOT NULL CHECK (length(display_name) BETWEEN 3 AND 40),
  emoji         TEXT NOT NULL CHECK (length(emoji) <= 4)
);

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_visitor    ON notes(visitor_id);

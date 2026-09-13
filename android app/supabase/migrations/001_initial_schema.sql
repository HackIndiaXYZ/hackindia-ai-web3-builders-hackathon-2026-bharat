-- ============================================================
-- Bharat Aapda Prabandhan — Supabase Database Migration
-- Run this in your Supabase SQL Editor to set up the schema.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- alerts table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Moderate', 'Low')),
  location    TEXT NOT NULL,
  body        TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'Community verified',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Anyone can read alerts.
CREATE POLICY "alerts_read" ON public.alerts FOR SELECT USING (TRUE);
-- Only authenticated users can insert alerts.
CREATE POLICY "alerts_insert" ON public.alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- --------------------------------------------------------
-- public_messages table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_messages (
  id          TEXT PRIMARY KEY,
  sender      TEXT NOT NULL,
  text        TEXT NOT NULL,
  timestamp   BIGINT NOT NULL,
  hash        TEXT NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.public_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_read" ON public.public_messages FOR SELECT USING (TRUE);
CREATE POLICY "messages_insert" ON public.public_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- --------------------------------------------------------
-- crowd_markers table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crowd_markers (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('Safe', 'Danger')),
  label       TEXT NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  time        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.crowd_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "markers_read" ON public.crowd_markers FOR SELECT USING (TRUE);
CREATE POLICY "markers_insert" ON public.crowd_markers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- --------------------------------------------------------
-- user_keys table (for E2E encryption public keys)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key  TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- Anyone can read public keys (they are public by design).
CREATE POLICY "keys_read" ON public.user_keys FOR SELECT USING (TRUE);
-- Only the owner can upsert their own key.
CREATE POLICY "keys_upsert" ON public.user_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "keys_update" ON public.user_keys FOR UPDATE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- Realtime: enable on relevant tables
-- --------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crowd_markers;

-- --------------------------------------------------------
-- Indexes for performance
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS alerts_created_at_idx ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_timestamp_idx ON public.public_messages(timestamp ASC);
CREATE INDEX IF NOT EXISTS markers_created_at_idx ON public.crowd_markers(created_at DESC);

-- First-class native Apple Health / HealthKit daily-summary ingestion.
-- These tables complement the canonical coach tables. They do not replace
-- Oura readiness, Garmin workout physiology, Rack/Motra history, nutrition,
-- recovery_sleep, or strength_sessions.

create table if not exists apple_health_sync_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  client_version text,
  device_name text,
  timezone text not null default 'Asia/Taipei',
  days_requested integer,
  days_written integer not null default 0,
  status text not null default 'started' check (status in ('started', 'success', 'partial', 'failed')),
  errors jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists apple_health_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  sync_run_id uuid references apple_health_sync_runs(id) on delete set null,
  summary_date date not null,
  source_app text not null default 'Apple Health',
  source_device text not null default 'iPhone',
  timezone text not null default 'Asia/Taipei',
  steps numeric,
  distance_mi numeric,
  flights_climbed numeric,
  active_energy_kcal numeric,
  basal_energy_kcal numeric,
  exercise_minutes numeric,
  stand_minutes numeric,
  resting_hr_bpm numeric,
  avg_hr_bpm numeric,
  min_hr_bpm numeric,
  max_hr_bpm numeric,
  hrv_sdnn_ms numeric,
  hrv_sample_count integer,
  sleep_minutes numeric,
  sleep_in_bed_minutes numeric,
  workout_count integer,
  strength_workout_count integer,
  cardio_workout_count integer,
  duplicate_policy_flags jsonb not null default '{}'::jsonb,
  metric_quality jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  raw_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, summary_date, source_app, source_device)
);

create index if not exists apple_health_sync_runs_profile_started_idx
  on apple_health_sync_runs(profile_id, started_at desc);

create index if not exists apple_health_sync_runs_profile_status_idx
  on apple_health_sync_runs(profile_id, status, started_at desc);

create index if not exists apple_health_daily_summaries_profile_date_idx
  on apple_health_daily_summaries(profile_id, summary_date desc);

alter table apple_health_sync_runs enable row level security;
alter table apple_health_daily_summaries enable row level security;

revoke all on table apple_health_sync_runs from anon, authenticated;
revoke all on table apple_health_daily_summaries from anon, authenticated;

grant select, insert, update, delete on table apple_health_sync_runs to service_role;
grant select, insert, update, delete on table apple_health_daily_summaries to service_role;

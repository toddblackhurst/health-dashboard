-- Apple Health / HealthKit V2 ingestion schema.
-- Safe to run repeatedly. Adds first-class daily summaries, workout imports,
-- and sync logs without modifying existing recovery, activity, or strength tables.

create table if not exists health_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  summary_date date not null,
  source text not null default 'apple_health',
  timezone text not null default 'Asia/Taipei',

  sleep_asleep_min integer,
  sleep_in_bed_min integer,
  sleep_efficiency_pct numeric,
  resting_hr_bpm numeric,
  hrv_sdnn_ms numeric,
  walking_hr_avg_bpm numeric,
  vo2_max numeric,
  respiratory_rate_rpm numeric,
  spo2_pct numeric,
  wrist_temp_c numeric,

  steps integer,
  active_energy_kcal numeric,
  exercise_min numeric,
  stand_hours numeric,
  walking_running_distance_km numeric,

  workout_count integer,
  strength_workout_count integer,
  cardio_workout_count integer,

  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(profile_id, summary_date, source)
);

create table if not exists health_workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  external_id text,
  source text not null default 'apple_health',
  workout_type text not null,
  started_at timestamptz,
  ended_at timestamptz,
  duration_min numeric,
  active_energy_kcal numeric,
  total_energy_kcal numeric,
  distance_km numeric,
  avg_hr_bpm numeric,
  max_hr_bpm numeric,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists health_workouts_profile_source_external_uidx
  on health_workouts(profile_id, source, external_id)
  where external_id is not null;

create table if not exists health_sync_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  source text not null default 'ios_healthkit',
  sync_started_at timestamptz not null default now(),
  sync_finished_at timestamptz,
  status text not null check (status in ('started', 'success', 'partial', 'failed')),
  days_requested integer,
  days_upserted integer,
  workouts_upserted integer,
  error_message text,
  app_version text,
  raw jsonb not null default '{}'::jsonb
);

create table if not exists coach_observations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  observation_date date not null default current_date,
  category text not null default 'training',
  observation text not null,
  evidence jsonb not null default '[]'::jsonb,
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  action_taken text,
  review_date date,
  status text not null default 'active' check (status in ('active', 'retired', 'needs_review')),
  source text not null default 'coach',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_daily_summaries_profile_date_idx
  on health_daily_summaries(profile_id, summary_date desc);

create index if not exists health_workouts_profile_started_idx
  on health_workouts(profile_id, started_at desc);

create index if not exists health_sync_logs_profile_started_idx
  on health_sync_logs(profile_id, sync_started_at desc);

create index if not exists coach_observations_profile_status_idx
  on coach_observations(profile_id, status, observation_date desc);

alter table health_daily_summaries enable row level security;
alter table health_workouts enable row level security;
alter table health_sync_logs enable row level security;
alter table coach_observations enable row level security;

-- Service role bypasses RLS for imports. User-facing policies should be
-- installed after Supabase Auth identity is finalized.

-- Workout Debrief Capture v1
-- Apply only after Todd explicitly approves the Supabase migration.

create table if not exists coach_workout_debriefs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  workout_date date not null,
  workout_started_at timestamptz,
  workout_completed_at timestamptz,
  source text not null default 'custom_gpt',
  planned_workout_id text,
  workout_title text,
  workout_type text not null default 'unknown'
    check (workout_type in ('strength', 'cardio', 'mobility', 'recovery', 'mixed', 'unknown')),
  completion_status text not null
    check (completion_status in ('completed', 'partially_completed', 'skipped', 'stopped_early')),
  session_rpe numeric check (session_rpe is null or (session_rpe >= 1 and session_rpe <= 10)),
  energy_before integer check (energy_before is null or (energy_before >= 1 and energy_before <= 10)),
  energy_after integer check (energy_after is null or (energy_after >= 1 and energy_after <= 10)),
  pain_reported boolean not null default false,
  pain_locations jsonb not null default '[]'::jsonb,
  pain_severity integer check (pain_severity is null or (pain_severity >= 0 and pain_severity <= 10)),
  pain_quality jsonb not null default '[]'::jsonb,
  symptoms jsonb not null default '[]'::jsonb,
  red_flag_symptoms jsonb not null default '[]'::jsonb,
  modifications jsonb not null default '[]'::jsonb,
  skipped_exercises jsonb not null default '[]'::jsonb,
  completed_exercises jsonb not null default '[]'::jsonb,
  notes text,
  coach_feedback text,
  nutrition_notes text,
  sleep_recovery_notes text,
  follow_up_needed boolean not null default false,
  safety_outcome text not null default 'none'
    check (safety_outcome in ('none', 'caution', 'red_flag')),
  memory_candidate_summary text,
  linked_observation_ids jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb
);

create index if not exists coach_workout_debriefs_profile_date_idx
  on coach_workout_debriefs(profile_id, workout_date desc, created_at desc);

create index if not exists coach_workout_debriefs_profile_safety_idx
  on coach_workout_debriefs(profile_id, safety_outcome, workout_date desc);

alter table coach_workout_debriefs enable row level security;

revoke all on table coach_workout_debriefs from anon, authenticated;

grant select, insert, update, delete on table coach_workout_debriefs to service_role;

-- Todd Personal Coach connected-coach schema
-- Apply in Supabase SQL editor or via Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  name text not null unique,
  sex text,
  age integer,
  height_cm numeric,
  gym text,
  timezone text default 'Asia/Taipei',
  goals jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  medical_context jsonb not null default '{}'::jsonb,
  source_hierarchy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  confidence_tier integer not null default 3,
  notes text
);

create table if not exists recovery_sleep (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  measured_date date not null,
  source text not null,
  recovery_score_pct numeric,
  sleep_score_pct numeric,
  hrv_ms numeric,
  resting_hr_bpm numeric,
  respiratory_rate_rpm numeric,
  spo2_pct numeric,
  wrist_temp_f numeric,
  total_sleep_min integer,
  time_in_bed_min integer,
  sleep_efficiency_pct numeric,
  deep_sleep_min integer,
  rem_sleep_min integer,
  sleep_bank_min integer,
  readiness_tier text,
  notes text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id, measured_date, source)
);

create table if not exists blood_pressure_readings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  measured_at timestamptz,
  measured_date date not null,
  systolic_mmhg integer not null,
  diastolic_mmhg integer not null,
  heart_rate_bpm integer,
  source text,
  doctor_review_flag boolean not null default false,
  notes text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
  ,
  unique(profile_id, measured_date, source)
);

create table if not exists body_comp_measurements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  measured_date date not null,
  measured_time time,
  source text not null,
  method text not null default 'unknown',
  confidence_tier integer not null default 3,
  weight_lbs numeric,
  body_fat_pct numeric,
  lean_mass_lbs numeric,
  visceral_fat_g numeric,
  visceral_fat_level numeric,
  skeletal_muscle_lbs numeric,
  trunk_muscle_lbs numeric,
  body_water_pct numeric,
  notes text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
  ,
  unique(profile_id, measured_date, source)
);

create table if not exists activity_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  activity_date date not null,
  source text,
  activity_type text not null,
  start_time time,
  duration_min numeric,
  distance_mi numeric,
  avg_heart_rate_bpm numeric,
  peak_heart_rate_bpm numeric,
  active_calories_kcal numeric,
  effort_level text,
  notes text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id, activity_date, source, activity_type, start_time)
);

create table if not exists strength_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  session_date date not null,
  source text,
  session_name text,
  session_type text,
  start_time time,
  duration_min numeric,
  total_volume_kg numeric,
  total_reps integer,
  avg_hr_bpm numeric,
  max_hr_bpm numeric,
  calories_kcal numeric,
  motra_url text,
  coaching_note text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id, session_date, source, session_name)
);

create table if not exists strength_exercises (
  id uuid primary key default gen_random_uuid(),
  strength_session_id uuid references strength_sessions(id) on delete cascade,
  exercise_order integer,
  name text not null,
  category text,
  notes text,
  raw jsonb not null default '{}'::jsonb
);

create table if not exists strength_sets (
  id uuid primary key default gen_random_uuid(),
  strength_exercise_id uuid references strength_exercises(id) on delete cascade,
  set_number integer,
  reps numeric,
  load_kg numeric,
  duration_sec numeric,
  distance_ft numeric,
  raw jsonb not null default '{}'::jsonb
);

create table if not exists nutrition_days (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  log_date date not null,
  source text,
  completeness text not null default 'partial',
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  sodium_mg numeric,
  fiber_g numeric,
  notes text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id, log_date, source)
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  nutrition_day_id uuid references nutrition_days(id) on delete cascade,
  meal_time time,
  name text not null,
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  source text,
  coach_callout text,
  raw jsonb not null default '{}'::jsonb
);

create table if not exists weekly_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  week_start date not null,
  label text,
  status text not null default 'locked',
  planned_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb,
  unique(profile_id, week_start)
);

create table if not exists planned_sessions (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid references weekly_plans(id) on delete cascade,
  planned_date date,
  day_index integer,
  session_type text,
  session_goal text,
  floor_plan text,
  time_cap_min integer,
  blocks jsonb not null default '[]'::jsonb,
  status text not null default 'locked'
);

create table if not exists coach_flags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  flag_date date not null,
  category text not null,
  severity text not null default 'warning',
  title text not null,
  detail text,
  status text not null default 'active',
  source text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('coach', 'user', 'system')),
  channel text not null default 'web',
  body text not null,
  message_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb
);

create table if not exists session_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  session_date date not null,
  rating_label text,
  completed_minutes numeric,
  best_movement text,
  worst_movement text,
  pain_notes text,
  difficulty text,
  freeform_note text,
  source text not null default 'web',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists doctor_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  note_date date not null,
  topic text not null,
  guidance text,
  training_impact text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists raw_imports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  source text not null,
  source_date date,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists recovery_sleep_profile_date_idx on recovery_sleep(profile_id, measured_date desc);
create index if not exists blood_pressure_profile_date_idx on blood_pressure_readings(profile_id, measured_date desc);
create index if not exists body_comp_profile_date_idx on body_comp_measurements(profile_id, measured_date desc);
create index if not exists strength_sessions_profile_date_idx on strength_sessions(profile_id, session_date desc);
create index if not exists nutrition_days_profile_date_idx on nutrition_days(profile_id, log_date desc);
create index if not exists coach_flags_profile_status_idx on coach_flags(profile_id, status, flag_date desc);
create index if not exists coach_messages_profile_time_idx on coach_messages(profile_id, message_at desc);

alter table profiles enable row level security;
alter table recovery_sleep enable row level security;
alter table blood_pressure_readings enable row level security;
alter table body_comp_measurements enable row level security;
alter table activity_sessions enable row level security;
alter table strength_sessions enable row level security;
alter table strength_exercises enable row level security;
alter table strength_sets enable row level security;
alter table nutrition_days enable row level security;
alter table meals enable row level security;
alter table weekly_plans enable row level security;
alter table planned_sessions enable row level security;
alter table coach_flags enable row level security;
alter table coach_messages enable row level security;
alter table session_feedback enable row level security;
alter table doctor_notes enable row level security;
alter table raw_imports enable row level security;

-- Service role bypasses RLS for imports. User-facing policies should be
-- installed after Supabase Auth identity is finalized.

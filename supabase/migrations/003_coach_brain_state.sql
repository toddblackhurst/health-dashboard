-- Coach brain state and decision audit tables.
-- Apply after 001/002. Safe to run repeatedly.

create table if not exists coach_state (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade unique,
  version text not null default '2026-05-03-pro-coach-v1',
  goals jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  gym_profile jsonb not null default '{}'::jsonb,
  source_hierarchy jsonb not null default '{}'::jsonb,
  avoid_list jsonb not null default '[]'::jsonb,
  travel_mode boolean not null default false,
  active_medical_loops jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists coach_decisions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  decision_date date not null,
  intent text not null,
  readiness_tier text,
  top_line_call text,
  risk_flags jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  response jsonb not null default '{}'::jsonb,
  model text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coach_state_profile_idx on coach_state(profile_id);
create index if not exists coach_decisions_profile_date_idx on coach_decisions(profile_id, decision_date desc, created_at desc);
create index if not exists coach_decisions_intent_idx on coach_decisions(profile_id, intent, created_at desc);

alter table coach_state enable row level security;
alter table coach_decisions enable row level security;

-- Weekly plan constraints for live planning sync.

do $$
begin
  alter table planned_sessions add column if not exists raw jsonb not null default '{}'::jsonb;
exception when duplicate_column then null;
end $$;

do $$
begin
  alter table planned_sessions add constraint planned_sessions_weekly_plan_day_key unique (weekly_plan_id, day_index);
exception when duplicate_object then null;
end $$;

create index if not exists planned_sessions_weekly_plan_date_idx on planned_sessions(weekly_plan_id, planned_date);

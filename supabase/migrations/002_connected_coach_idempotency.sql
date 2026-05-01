-- Idempotency constraints for repeat imports.
-- Safe to apply after 001 if the initial schema was already installed.

do $$
begin
  alter table profiles add constraint profiles_name_key unique (name);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table blood_pressure_readings add constraint blood_pressure_profile_date_source_key unique (profile_id, measured_date, source);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table body_comp_measurements add constraint body_comp_profile_date_source_key unique (profile_id, measured_date, source);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table activity_sessions add constraint activity_sessions_profile_date_source_type_time_key unique (profile_id, activity_date, source, activity_type, start_time);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table strength_sessions add constraint strength_sessions_profile_date_source_name_key unique (profile_id, session_date, source, session_name);
exception when duplicate_object then null;
end $$;

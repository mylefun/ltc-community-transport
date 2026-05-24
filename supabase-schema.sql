-- 社區交通車每日接送系統 Supabase schema
-- 在 Supabase SQL Editor 執行。建議先建立專案，再貼上此檔。

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'coordinator', 'driver');
  end if;

  if not exists (select 1 from pg_type where typname = 'ride_status') then
    create type public.ride_status as enum ('scheduled', 'picked_up', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'ride_event_type') then
    create type public.ride_event_type as enum ('pickup', 'dropoff', 'cancel', 'note');
  end if;
end $$;

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null,
  identity_no text unique,
  phone text,
  vehicle_no text not null,
  quick_login_code_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drivers
  add column if not exists identity_no text;

create unique index if not exists idx_drivers_identity_no
  on public.drivers(identity_no)
  where identity_no is not null;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'driver',
  driver_id uuid references public.drivers(id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint driver_profile_required check (
    role <> 'driver' or driver_id is not null
  )
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_no text not null unique,
  full_name text not null,
  identity_no text,
  gender text,
  birth_date date,
  phone text,
  phone_landline text,
  mobile_phone text,
  welfare_status text,
  emergency_contact text,
  emergency_relation text,
  emergency_phone text,
  emergency_contacts jsonb not null default '[]'::jsonb,
  care_level text,
  mobility_type text,
  assistive_device text,
  service_area text,
  care_manager text,
  care_manager_phone text,
  pickup_address text not null,
  default_destination text not null,
  community_site text,
  quota_note text,
  destinations jsonb not null default '[]'::jsonb,
  ride_note text,
  notes text,
  active boolean not null default true,
  service_start_date date,
  service_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases
  add column if not exists identity_no text,
  add column if not exists gender text,
  add column if not exists birth_date date,
  add column if not exists phone_landline text,
  add column if not exists mobile_phone text,
  add column if not exists welfare_status text,
  add column if not exists emergency_relation text,
  add column if not exists emergency_contacts jsonb not null default '[]'::jsonb,
  add column if not exists assistive_device text,
  add column if not exists service_area text,
  add column if not exists care_manager text,
  add column if not exists care_manager_phone text,
  add column if not exists community_site text,
  add column if not exists quota_note text,
  add column if not exists destinations jsonb not null default '[]'::jsonb,
  add column if not exists ride_note text,
  add column if not exists service_start_date date,
  add column if not exists service_end_date date;

create unique index if not exists idx_cases_identity_no
  on public.cases(identity_no)
  where identity_no is not null;

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  driver_id uuid not null references public.drivers(id) on delete restrict,
  schedule_type text not null default 'single' check (schedule_type in ('single', 'weekly')),
  service_date date,
  start_date date,
  end_date date,
  days_of_week jsonb not null default '[]'::jsonb,
  scheduled_pickup time not null,
  scheduled_dropoff time,
  pickup_address text not null,
  destination_address text not null,
  purpose text,
  special_requirements text,
  status text not null default 'active' check (status in ('active', 'paused', 'stopped')),
  stop_reason text,
  date_overrides jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_schedules_case_date
  on public.schedules(case_id, service_date);

create index if not exists idx_schedules_driver_date
  on public.schedules(driver_id, service_date);

alter table public.schedules
  add column if not exists case_id uuid references public.cases(id) on delete restrict,
  add column if not exists driver_id uuid references public.drivers(id) on delete restrict,
  add column if not exists schedule_type text not null default 'single',
  add column if not exists service_date date,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists days_of_week jsonb not null default '[]'::jsonb,
  add column if not exists scheduled_pickup time,
  add column if not exists scheduled_dropoff time,
  add column if not exists pickup_address text,
  add column if not exists destination_address text,
  add column if not exists purpose text,
  add column if not exists special_requirements text,
  add column if not exists status text not null default 'active',
  add column if not exists stop_reason text,
  add column if not exists date_overrides jsonb not null default '[]'::jsonb;

create table if not exists public.daily_rides (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  case_id uuid not null references public.cases(id) on delete restrict,
  driver_id uuid not null references public.drivers(id) on delete restrict,
  schedule_id uuid references public.schedules(id) on delete set null,
  scheduled_pickup time not null,
  scheduled_dropoff time,
  pickup_address text not null,
  destination_address text not null,
  purpose text,
  pickup_at timestamptz,
  pickup_lat numeric(10, 7),
  pickup_lng numeric(10, 7),
  dropoff_at timestamptz,
  dropoff_lat numeric(10, 7),
  dropoff_lng numeric(10, 7),
  status public.ride_status not null default 'scheduled',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dropoff_after_pickup check (
    pickup_at is null or dropoff_at is null or dropoff_at >= pickup_at
  )
);

alter table public.daily_rides
  add column if not exists schedule_id uuid references public.schedules(id) on delete set null;

create table if not exists public.ride_events (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.daily_rides(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  event_type public.ride_event_type not null,
  occurred_at timestamptz not null default now(),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  accuracy_meters integer,
  location_source text default 'gps',
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.driver_locations (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  ride_id uuid references public.daily_rides(id) on delete set null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  accuracy_meters integer,
  event_type public.ride_event_type,
  location_source text not null default 'gps',
  updated_at timestamptz not null default now()
);

create index if not exists idx_daily_rides_service_date
  on public.daily_rides(service_date, scheduled_pickup);

create index if not exists idx_daily_rides_driver_date
  on public.daily_rides(driver_id, service_date, scheduled_pickup);

create index if not exists idx_daily_rides_case_date
  on public.daily_rides(case_id, service_date);

create unique index if not exists idx_daily_rides_schedule_date
  on public.daily_rides(schedule_id, service_date)
  where schedule_id is not null;

create index if not exists idx_ride_events_ride
  on public.ride_events(ride_id, occurred_at);

create index if not exists idx_driver_locations_updated_at
  on public.driver_locations(updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_drivers_touch_updated_at on public.drivers;
create trigger trg_drivers_touch_updated_at
before update on public.drivers
for each row execute function public.touch_updated_at();

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_cases_touch_updated_at on public.cases;
create trigger trg_cases_touch_updated_at
before update on public.cases
for each row execute function public.touch_updated_at();

create or replace function public.touch_schedule_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_schedules_touch_updated_at on public.schedules;
create trigger trg_schedules_touch_updated_at
before update on public.schedules
for each row execute function public.touch_schedule_updated_at();

create or replace function public.sync_daily_ride_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' then
    new.updated_at = now();
    return new;
  end if;

  if new.dropoff_at is not null then
    new.status = 'completed';
  elsif new.pickup_at is not null then
    new.status = 'picked_up';
  else
    new.status = 'scheduled';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_rides_sync_status on public.daily_rides;
create trigger trg_daily_rides_sync_status
before insert or update on public.daily_rides
for each row execute function public.sync_daily_ride_status();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.current_driver_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select driver_id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('admin', 'coordinator'), false)
$$;

alter table public.drivers enable row level security;
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.schedules enable row level security;
alter table public.daily_rides enable row level security;
alter table public.ride_events enable row level security;
alter table public.driver_locations enable row level security;

drop policy if exists "profiles_read_own_or_coordinator" on public.profiles;
create policy "profiles_read_own_or_coordinator"
on public.profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_coordinator());

drop policy if exists "profiles_manage_by_coordinator" on public.profiles;
create policy "profiles_manage_by_coordinator"
on public.profiles
for all
to authenticated
using (public.is_coordinator())
with check (public.is_coordinator());

drop policy if exists "drivers_read_self_or_coordinator" on public.drivers;
create policy "drivers_read_self_or_coordinator"
on public.drivers
for select
to authenticated
using (
  public.is_coordinator()
  or auth_user_id = auth.uid()
  or id = public.current_driver_id()
);

drop policy if exists "drivers_manage_by_coordinator" on public.drivers;
create policy "drivers_manage_by_coordinator"
on public.drivers
for all
to authenticated
using (public.is_coordinator())
with check (public.is_coordinator());

drop policy if exists "cases_read_for_staff" on public.cases;
create policy "cases_read_for_staff"
on public.cases
for select
to authenticated
using (public.is_coordinator());

drop policy if exists "cases_manage_by_coordinator" on public.cases;
create policy "cases_manage_by_coordinator"
on public.cases
for all
to authenticated
using (public.is_coordinator())
with check (public.is_coordinator());

drop policy if exists "schedules_read_for_staff" on public.schedules;
create policy "schedules_read_for_staff"
on public.schedules
for select
to authenticated
using (public.is_coordinator());

drop policy if exists "schedules_manage_by_coordinator" on public.schedules;
create policy "schedules_manage_by_coordinator"
on public.schedules
for all
to authenticated
using (public.is_coordinator())
with check (public.is_coordinator());

drop policy if exists "rides_read_for_assigned_driver_or_coordinator" on public.daily_rides;
create policy "rides_read_for_assigned_driver_or_coordinator"
on public.daily_rides
for select
to authenticated
using (
  public.is_coordinator()
  or driver_id = public.current_driver_id()
);

drop policy if exists "rides_manage_by_coordinator" on public.daily_rides;
create policy "rides_manage_by_coordinator"
on public.daily_rides
for all
to authenticated
using (public.is_coordinator())
with check (public.is_coordinator());

drop policy if exists "events_read_for_staff" on public.ride_events;
create policy "events_read_for_staff"
on public.ride_events
for select
to authenticated
using (
  public.is_coordinator()
  or driver_id = public.current_driver_id()
);

drop policy if exists "events_insert_by_coordinator" on public.ride_events;
create policy "events_insert_by_coordinator"
on public.ride_events
for insert
to authenticated
with check (public.is_coordinator());

drop policy if exists "driver_locations_read_for_staff" on public.driver_locations;
create policy "driver_locations_read_for_staff"
on public.driver_locations
for select
to authenticated
using (
  public.is_coordinator()
  or driver_id = public.current_driver_id()
);

drop policy if exists "driver_locations_manage_by_coordinator" on public.driver_locations;
create policy "driver_locations_manage_by_coordinator"
on public.driver_locations
for all
to authenticated
using (public.is_coordinator())
with check (public.is_coordinator());

create or replace function public.mark_ride_pickup(
  p_ride_id uuid,
  p_lat numeric default null,
  p_lng numeric default null,
  p_accuracy_meters integer default null,
  p_location_source text default 'gps'
)
returns public.daily_rides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_driver_id uuid;
  v_ride public.daily_rides;
  v_should_log boolean;
begin
  select role, driver_id
  into v_role, v_driver_id
  from public.profiles
  where user_id = auth.uid();

  if v_role is null then
    raise exception '使用者尚未建立系統身分';
  end if;

  select *
  into v_ride
  from public.daily_rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception '找不到接送班次';
  end if;

  if v_role not in ('admin', 'coordinator') and v_ride.driver_id <> v_driver_id then
    raise exception '沒有權限更新此班次';
  end if;

  if v_ride.status = 'cancelled' then
    raise exception '已取消班次不可打卡';
  end if;

  v_should_log := v_ride.pickup_at is null;

  update public.daily_rides
  set
    pickup_at = coalesce(pickup_at, now()),
    pickup_lat = coalesce(p_lat, pickup_lat),
    pickup_lng = coalesce(p_lng, pickup_lng)
  where id = p_ride_id
  returning * into v_ride;

  if v_should_log then
    insert into public.ride_events(
      ride_id,
      driver_id,
      event_type,
      occurred_at,
      latitude,
      longitude,
      accuracy_meters,
      location_source,
      created_by
    )
    values (
      v_ride.id,
      v_ride.driver_id,
      'pickup',
      v_ride.pickup_at,
      p_lat,
      p_lng,
      p_accuracy_meters,
      coalesce(p_location_source, 'gps'),
      auth.uid()
    );
  end if;

  if p_lat is not null and p_lng is not null then
    insert into public.driver_locations(
      driver_id,
      ride_id,
      latitude,
      longitude,
      accuracy_meters,
      event_type,
      location_source,
      updated_at
    )
    values (
      v_ride.driver_id,
      v_ride.id,
      p_lat,
      p_lng,
      p_accuracy_meters,
      'pickup',
      coalesce(p_location_source, 'gps'),
      v_ride.pickup_at
    )
    on conflict (driver_id) do update
    set
      ride_id = excluded.ride_id,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      accuracy_meters = excluded.accuracy_meters,
      event_type = excluded.event_type,
      location_source = excluded.location_source,
      updated_at = excluded.updated_at;
  end if;

  return v_ride;
end;
$$;

create or replace function public.mark_ride_dropoff(
  p_ride_id uuid,
  p_lat numeric default null,
  p_lng numeric default null,
  p_accuracy_meters integer default null,
  p_location_source text default 'gps'
)
returns public.daily_rides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_driver_id uuid;
  v_ride public.daily_rides;
  v_should_log boolean;
begin
  select role, driver_id
  into v_role, v_driver_id
  from public.profiles
  where user_id = auth.uid();

  if v_role is null then
    raise exception '使用者尚未建立系統身分';
  end if;

  select *
  into v_ride
  from public.daily_rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception '找不到接送班次';
  end if;

  if v_role not in ('admin', 'coordinator') and v_ride.driver_id <> v_driver_id then
    raise exception '沒有權限更新此班次';
  end if;

  if v_ride.status = 'cancelled' then
    raise exception '已取消班次不可打卡';
  end if;

  if v_ride.pickup_at is null then
    raise exception '請先紀錄接到個案時間';
  end if;

  v_should_log := v_ride.dropoff_at is null;

  update public.daily_rides
  set
    dropoff_at = coalesce(dropoff_at, now()),
    dropoff_lat = coalesce(p_lat, dropoff_lat),
    dropoff_lng = coalesce(p_lng, dropoff_lng)
  where id = p_ride_id
  returning * into v_ride;

  if v_should_log then
    insert into public.ride_events(
      ride_id,
      driver_id,
      event_type,
      occurred_at,
      latitude,
      longitude,
      accuracy_meters,
      location_source,
      created_by
    )
    values (
      v_ride.id,
      v_ride.driver_id,
      'dropoff',
      v_ride.dropoff_at,
      p_lat,
      p_lng,
      p_accuracy_meters,
      coalesce(p_location_source, 'gps'),
      auth.uid()
    );
  end if;

  if p_lat is not null and p_lng is not null then
    insert into public.driver_locations(
      driver_id,
      ride_id,
      latitude,
      longitude,
      accuracy_meters,
      event_type,
      location_source,
      updated_at
    )
    values (
      v_ride.driver_id,
      v_ride.id,
      p_lat,
      p_lng,
      p_accuracy_meters,
      'dropoff',
      coalesce(p_location_source, 'gps'),
      v_ride.dropoff_at
    )
    on conflict (driver_id) do update
    set
      ride_id = excluded.ride_id,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      accuracy_meters = excluded.accuracy_meters,
      event_type = excluded.event_type,
      location_source = excluded.location_source,
      updated_at = excluded.updated_at;
  end if;

  return v_ride;
end;
$$;

grant execute on function public.mark_ride_pickup(uuid, numeric, numeric, integer, text) to authenticated;
grant execute on function public.mark_ride_dropoff(uuid, numeric, numeric, integer, text) to authenticated;

drop view if exists public.daily_ride_board;
create or replace view public.daily_ride_board
with (security_invoker = true)
as
select
  r.id,
  r.service_date,
  r.scheduled_pickup,
  r.scheduled_dropoff,
  r.pickup_at,
  r.pickup_lat,
  r.pickup_lng,
  r.dropoff_at,
  r.dropoff_lat,
  r.dropoff_lng,
  r.status,
  r.purpose,
  c.case_no,
  c.full_name as case_name,
  c.phone as case_phone,
  c.mobility_type,
  c.care_level,
  r.pickup_address,
  r.destination_address,
  d.display_name as driver_name,
  d.vehicle_no
from public.daily_rides r
join public.cases c on c.id = r.case_id
join public.drivers d on d.id = r.driver_id;

drop view if exists public.driver_location_board;
create or replace view public.driver_location_board
with (security_invoker = true)
as
select
  d.id as driver_id,
  d.display_name as driver_name,
  d.vehicle_no,
  dl.ride_id,
  dl.latitude,
  dl.longitude,
  dl.accuracy_meters,
  dl.event_type,
  dl.location_source,
  dl.updated_at
from public.drivers d
left join public.driver_locations dl on dl.driver_id = d.id
where d.active = true;

alter table public.drivers
  drop column if exists route_label;

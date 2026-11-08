-- StreamLock shared backend. Run once in Supabase SQL Editor.
-- Only the public publishable key belongs in browser code. Never use service_role here.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text not null default 'Viewer',
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_state (
  id integer primary key check (id = 1),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

create table if not exists public.media_files (
  id text primary key,
  path text not null unique,
  public_url text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_stats (
  id integer primary key check (id = 1),
  total_unlocks bigint not null default 0,
  banner_impressions bigint not null default 0,
  rewarded_ad_completes bigint not null default 0,
  estimated_earnings_usd numeric not null default 0
);
insert into public.site_stats(id) values (1) on conflict(id) do nothing;

create table if not exists public.video_views (
  video_id text primary key,
  views bigint not null default 0
);

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) or exists(
    select 1 from auth.users
    where id = auth.uid()
      and (
        raw_user_meta_data->>'username' = 'yashmacaraya123-create'
        or email = 'yashmacaraya123@gmail.com'
      )
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare supplied_username text;
begin
  supplied_username := nullif(new.raw_user_meta_data->>'username','');
  insert into public.profiles(id,username,full_name,role)
  values (
    new.id,
    coalesce(supplied_username,split_part(new.email,'@',1)),
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Viewer'),
    case when supplied_username = 'yashmacaraya123-create' then 'admin' else 'user' end
  ) on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Upgrade existing Auth users into profiles and recognize the requested admin username.
insert into public.profiles(id,username,full_name,role)
select id,
  coalesce(nullif(raw_user_meta_data->>'username',''),split_part(email,'@',1)),
  coalesce(nullif(raw_user_meta_data->>'full_name',''),'Viewer'),
  case when raw_user_meta_data->>'username' = 'yashmacaraya123-create' then 'admin' else 'user' end
from auth.users
on conflict(id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  role = case when excluded.username = 'yashmacaraya123-create' then 'admin' else public.profiles.role end;

alter table public.profiles enable row level security;
alter table public.site_state enable row level security;
alter table public.favorites enable row level security;
alter table public.media_files enable row level security;
alter table public.site_stats enable row level security;
alter table public.video_views enable row level security;

-- Profiles: users can read/update their own non-role details; only admins can read all.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid() and role = 'user');

-- Published website content is publicly readable but only admin-editable.
drop policy if exists "site_state_public_read" on public.site_state;
create policy "site_state_public_read" on public.site_state for select using (true);
drop policy if exists "site_state_admin_insert" on public.site_state;
create policy "site_state_admin_insert" on public.site_state for insert with check (public.is_admin());
drop policy if exists "site_state_admin_update" on public.site_state;
create policy "site_state_admin_update" on public.site_state for update
using (public.is_admin()) with check (public.is_admin());

-- Each signed-in viewer owns only their favorites.
drop policy if exists "favorites_own_read" on public.favorites;
create policy "favorites_own_read" on public.favorites for select using (user_id = auth.uid());
drop policy if exists "favorites_own_insert" on public.favorites;
create policy "favorites_own_insert" on public.favorites for insert with check (user_id = auth.uid());
drop policy if exists "favorites_own_delete" on public.favorites;
create policy "favorites_own_delete" on public.favorites for delete using (user_id = auth.uid());

-- Media metadata and public files are readable by viewers; only admin can upload/change them.
drop policy if exists "media_public_read" on public.media_files;
create policy "media_public_read" on public.media_files for select using (true);
drop policy if exists "media_admin_insert" on public.media_files;
create policy "media_admin_insert" on public.media_files for insert with check (public.is_admin());
drop policy if exists "media_admin_update" on public.media_files;
create policy "media_admin_update" on public.media_files for update
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "media_admin_delete" on public.media_files;
create policy "media_admin_delete" on public.media_files for delete using (public.is_admin());

drop policy if exists "stats_public_read" on public.site_stats;
create policy "stats_public_read" on public.site_stats for select using (true);
drop policy if exists "views_public_read" on public.video_views;
create policy "views_public_read" on public.video_views for select using (true);

-- Small public activity increments are validated and atomically stored outside admin content.
create or replace function public.sl_record_activity(
  p_video_id text default null,
  p_unlocks integer default 0,
  p_rewards integer default 0,
  p_banner integer default 0,
  p_earnings numeric default 0
) returns void language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if p_unlocks not between 0 and 1 or p_rewards not between 0 and 1
     or p_banner not between 0 and 1 or p_earnings < 0 or p_earnings > 10 then
    raise exception 'Invalid activity values';
  end if;
  insert into public.site_stats(id,total_unlocks,banner_impressions,rewarded_ad_completes,estimated_earnings_usd)
  values (1,p_unlocks,p_banner,p_rewards,p_earnings)
  on conflict(id) do update set
    total_unlocks = public.site_stats.total_unlocks + p_unlocks,
    banner_impressions = public.site_stats.banner_impressions + p_banner,
    rewarded_ad_completes = public.site_stats.rewarded_ad_completes + p_rewards,
    estimated_earnings_usd = public.site_stats.estimated_earnings_usd + p_earnings;
  if p_video_id is not null and exists (
    select 1 from public.site_state s, jsonb_array_elements(s.payload->'links') v
    where s.id = 1 and v->>'id' = p_video_id
  ) then
    insert into public.video_views(video_id,views) values (p_video_id,p_unlocks)
    on conflict(video_id) do update set views = public.video_views.views + p_unlocks;
  end if;
end;
$$;
revoke all on function public.sl_record_activity(text,integer,integer,integer,numeric) from public;
grant execute on function public.sl_record_activity(text,integer,integer,integer,numeric) to anon,authenticated;

insert into storage.buckets(id,name,public) values ('streamlock-media','streamlock-media',true)
on conflict(id) do update set public = true;
drop policy if exists "streamlock_media_public_read" on storage.objects;
create policy "streamlock_media_public_read" on storage.objects for select
using (bucket_id = 'streamlock-media');
drop policy if exists "streamlock_media_admin_insert" on storage.objects;
create policy "streamlock_media_admin_insert" on storage.objects for insert
with check (bucket_id = 'streamlock-media' and public.is_admin());
drop policy if exists "streamlock_media_admin_update" on storage.objects;
create policy "streamlock_media_admin_update" on storage.objects for update
using (bucket_id = 'streamlock-media' and public.is_admin())
with check (bucket_id = 'streamlock-media' and public.is_admin());
drop policy if exists "streamlock_media_admin_delete" on storage.objects;
create policy "streamlock_media_admin_delete" on storage.objects for delete
using (bucket_id = 'streamlock-media' and public.is_admin());

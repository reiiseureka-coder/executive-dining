-- REVIEWED FILE ONLY. Do not apply to a live project without explicit approval.
-- Additive, separate from legacy public.restaurants/reviews/user_profiles.
-- Before activation, audit and remediate legacy public-table policies separately.
begin;
create schema dining_private;
revoke all on schema dining_private from public, anon, authenticated;

create table dining_private.settings (
  id boolean primary key default true check (id),
  public_enabled boolean not null default false,
  reviews_enabled boolean not null default false
);
insert into dining_private.settings default values;
create table dining_private.editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- No client-facing editor enrollment API, no inferred role from user metadata/rank.
create table dining_private.restaurants (
  id uuid primary key default gen_random_uuid(),
  import_key text unique, -- App-owned idempotent import batch key, never a provider ID.
  candidate_name text not null check (length(btrim(candidate_name)) between 1 and 200),
  candidate_address text check (length(btrim(candidate_address)) between 1 and 500),
  city text not null check (city like '名古屋市%'),
  status text not null default 'candidate' check (status in ('candidate','verified','rejected')),
  version integer not null default 1 check (version > 0),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'verified') = (verified_at is not null))
);
create table dining_private.restaurant_sources (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references dining_private.restaurants(id) on delete cascade,
  provider text not null check (length(provider) between 1 and 100),
  source_url text not null check (source_url ~ '^https?://[^[:space:]]+$'),
  provider_record_id text, -- Nullable: OpenPOI does not currently provide a stable record ID.
  raw_record jsonb check (raw_record is null or jsonb_typeof(raw_record) = 'object'),
  match_key text, -- A review hint, never a unique key or automatic merge instruction.
  licenses text[] not null default '{}',
  attributions text[] not null default '{}',
  fetched_at timestamptz not null,
  verified_at timestamptz,
  publication_basis text not null default 'unreviewed' check (publication_basis in ('unreviewed','facts_only','licensed','permission')),
  license_reviewed_at timestamptz,
  unique (restaurant_id, id),
  check (publication_basis <> 'facts_only' or provider = 'official'),
  check (publication_basis = 'unreviewed' or license_reviewed_at is not null),
  check (publication_basis <> 'licensed' or cardinality(licenses) > 0)
);
create table dining_private.restaurant_facts (
  restaurant_id uuid not null references dining_private.restaurants(id) on delete cascade,
  field text not null check (field in ('name','address','website','genre','private_room','price','hours','access','coordinates','notice')),
  value text not null check (length(btrim(value)) between 1 and 1500),
  source_id uuid not null,
  verified_at timestamptz not null,
  verified_by uuid references auth.users(id) on delete set null,
  primary key (restaurant_id, field),
  foreign key (restaurant_id, source_id) references dining_private.restaurant_sources(restaurant_id, id),
  check (field <> 'website' or value ~ '^https?://[^[:space:]]+$')
);
create table dining_private.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references dining_private.restaurants(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  display_name text not null check (length(btrim(display_name)) between 1 and 40),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (length(btrim(comment)) between 10 and 2000),
  visited_month date not null check (extract(day from visited_month) = 1),
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (restaurant_id, author_id),
  check ((status = 'approved') = (published_at is not null))
);
create table dining_private.moderation_events (
  id bigint generated always as identity primary key,
  restaurant_id uuid references dining_private.restaurants(id) on delete set null,
  review_id uuid references dining_private.reviews(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index restaurant_status_idx on dining_private.restaurants(status, created_at);
create index restaurant_sources_idx on dining_private.restaurant_sources(restaurant_id);
create index review_status_idx on dining_private.reviews(restaurant_id, status);

-- Defense in depth: clients have no schema/table access and no permissive RLS policies.
alter table dining_private.settings enable row level security;
alter table dining_private.editors enable row level security;
alter table dining_private.restaurants enable row level security;
alter table dining_private.restaurant_sources enable row level security;
alter table dining_private.restaurant_facts enable row level security;
alter table dining_private.reviews enable row level security;
alter table dining_private.moderation_events enable row level security;
revoke all on all tables in schema dining_private from public, anon, authenticated;
revoke all on all sequences in schema dining_private from public, anon, authenticated;
alter default privileges in schema dining_private revoke all on tables from public, anon, authenticated;

create function public.dining_editor_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from dining_private.editors e where e.user_id = auth.uid());
$$;

create function dining_private.fact_json(restaurant uuid) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'field', f.field, 'value', f.value, 'sourceUrl', s.source_url, 'provider', s.provider,
    'licenses', s.licenses, 'attributions', s.attributions, 'fetchedAt', s.fetched_at, 'verifiedAt', f.verified_at
  ) order by f.field), '[]'::jsonb)
  from dining_private.restaurant_facts f
  join dining_private.restaurant_sources s on s.id = f.source_id and s.restaurant_id = f.restaurant_id
  where f.restaurant_id = restaurant and s.publication_basis <> 'unreviewed' and s.verified_at is not null;
$$;

create function public.dining_public_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'status', r.status, 'name', n.value, 'address', a.value, 'verifiedAt', r.verified_at,
    'facts', dining_private.fact_json(r.id),
    'reviews', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', v.id, 'displayName', v.display_name, 'rating', v.rating, 'comment', v.comment,
      'visitedMonth', to_char(v.visited_month, 'YYYY-MM'), 'publishedAt', v.published_at
    ) order by v.published_at desc), '[]'::jsonb) from dining_private.reviews v
      where v.restaurant_id = r.id and v.status = 'approved' and v.author_id is not null and (select reviews_enabled from dining_private.settings))
  ) order by n.value), '[]'::jsonb)
  from dining_private.restaurants r
  join dining_private.restaurant_facts n on n.restaurant_id = r.id and n.field = 'name'
  join dining_private.restaurant_facts a on a.restaurant_id = r.id and a.field = 'address'
  where r.status = 'verified' and (select public_enabled from dining_private.settings);
$$;

create function public.dining_editor_queue() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.dining_editor_access() then raise exception 'Editor access required' using errcode = '42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'name', r.candidate_name, 'address', r.candidate_address, 'status', r.status,
    'version', r.version, 'verifiedAt', r.verified_at, 'facts', dining_private.fact_json(r.id),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'rawRecord', s.raw_record, 'provider', s.provider, 'sourceUrl', s.source_url, 'licenses', s.licenses,
      'attributions', s.attributions, 'fetchedAt', s.fetched_at, 'verifiedAt', s.verified_at, 'publicationBasis', s.publication_basis
    ) order by s.fetched_at), '[]'::jsonb) from dining_private.restaurant_sources s where s.restaurant_id = r.id)
  ) order by r.created_at desc), '[]'::jsonb) from (select * from dining_private.restaurants order by created_at desc limit 200) r);
end;
$$;

-- Only short independently checked facts, not copied descriptions/photos/reviews.
-- Source attribution remains attached to each fact. Existing OpenPOI evidence is never relabeled as official.
create function public.dining_record_official_fact(restaurant_id uuid, expected_version integer, fact_field text, fact_value text, official_url text) returns void
language plpgsql security definer set search_path = '' as $$
declare source uuid; record dining_private.restaurants; lng double precision; lat double precision;
begin
  if not public.dining_editor_access() then raise exception 'Editor access required' using errcode = '42501'; end if;
  select * into record from dining_private.restaurants where id = restaurant_id for update;
  if not found or expected_version is null or record.version <> expected_version then raise exception 'Stale restaurant version' using errcode = '40001'; end if;
  if official_url !~ '^https://[^[:space:]@]+$' or length(official_url) > 2000 then raise exception 'Official HTTPS source required'; end if;
  if fact_field = 'coordinates' then
    if fact_value !~ '^[0-9]+\.?[0-9]*,[0-9]+\.?[0-9]*$' then raise exception 'Use lng,lat'; end if;
    lng := split_part(fact_value, ',', 1)::double precision; lat := split_part(fact_value, ',', 2)::double precision;
    if lng not between 136.75 and 137.15 or lat not between 35 and 35.35 then raise exception 'Outside Nagoya bounds'; end if;
  end if;
  insert into dining_private.restaurant_sources (restaurant_id, provider, source_url, fetched_at, verified_at, publication_basis, license_reviewed_at)
    values (restaurant_id, 'official', official_url, now(), now(), 'facts_only', now()) returning id into source;
  insert into dining_private.restaurant_facts as f (restaurant_id, field, value, source_id, verified_at, verified_by)
    values (restaurant_id, fact_field, btrim(fact_value), source, now(), auth.uid())
    on conflict on constraint restaurant_facts_pkey do update set value = excluded.value, source_id = excluded.source_id, verified_at = excluded.verified_at, verified_by = excluded.verified_by;
  update dining_private.restaurants set status = 'candidate', verified_at = null, version = version + 1, updated_at = now() where id = restaurant_id;
  insert into dining_private.moderation_events (restaurant_id, actor_id, action, reason) values (restaurant_id, auth.uid(), 'record_fact', fact_field);
end;
$$;

create function public.dining_moderate_restaurant(restaurant_id uuid, expected_version integer, next_status text, reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare record dining_private.restaurants;
begin
  if not public.dining_editor_access() then raise exception 'Editor access required' using errcode = '42501'; end if;
  select * into record from dining_private.restaurants where id = restaurant_id for update;
  if not found or expected_version is null or record.version <> expected_version then raise exception 'Stale restaurant version' using errcode = '40001'; end if;
  if next_status not in ('candidate','verified','rejected') then raise exception 'Invalid status'; end if;
  if next_status = 'verified' then
    if (select count(*) from dining_private.restaurant_facts f join dining_private.restaurant_sources s on s.id = f.source_id
        where f.restaurant_id = dining_moderate_restaurant.restaurant_id and f.field in ('name','address','website') and s.provider = 'official'
        and s.verified_at is not null and s.publication_basis = 'facts_only') <> 3 then
      raise exception 'Official name, address and website evidence required';
    end if;
    if exists (select 1 from dining_private.restaurant_facts f join dining_private.restaurant_sources s on s.id = f.source_id
        where f.restaurant_id = dining_moderate_restaurant.restaurant_id and (s.publication_basis = 'unreviewed' or s.verified_at is null)) then
      raise exception 'All published facts require reviewed evidence';
    end if;
  end if;
  update dining_private.restaurants set status = next_status, verified_at = case when next_status = 'verified' then now() end, version = version + 1, updated_at = now() where id = restaurant_id;
  insert into dining_private.moderation_events (restaurant_id, actor_id, action, reason) values (restaurant_id, auth.uid(), next_status, btrim(reason));
end;
$$;

create function public.dining_submit_review(restaurant_id uuid, display_name text, rating integer, comment text, visited_month date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if not (select reviews_enabled and public_enabled from dining_private.settings) then raise exception 'Reviews are not open'; end if;
  if visited_month > current_date or visited_month < date '2000-01-01' then raise exception 'Invalid visit month'; end if;
  if not exists (select 1 from dining_private.restaurants r where r.id = restaurant_id and r.status = 'verified') then raise exception 'Verified restaurant required'; end if;
  -- Serialize per author. This is a bounded DB safeguard, not a replacement for abuse controls.
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if (select count(*) from dining_private.reviews v where v.author_id = auth.uid() and v.created_at > now() - interval '1 day') >= 5 then raise exception 'Daily review limit'; end if;
  insert into dining_private.reviews (restaurant_id, author_id, display_name, rating, comment, visited_month)
    values (restaurant_id, auth.uid(), btrim(display_name), rating, btrim(comment), visited_month) returning id into result;
  return result;
end;
$$;

create function public.dining_withdraw_review(review_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update dining_private.reviews set status = 'withdrawn', published_at = null, version = version + 1 where id = review_id and author_id = auth.uid();
  if not found then raise exception 'Review access denied' using errcode = '42501'; end if;
  insert into dining_private.moderation_events (review_id, actor_id, action, reason) values (review_id, auth.uid(), 'withdrawn', 'Author withdrawal');
end;
$$;

create function public.dining_moderate_review(review_id uuid, expected_version integer, next_status text, reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare record dining_private.reviews;
begin
  if not public.dining_editor_access() then raise exception 'Editor access required' using errcode = '42501'; end if;
  select * into record from dining_private.reviews where id = review_id for update;
  if not found or expected_version is null or record.version <> expected_version then raise exception 'Stale review version' using errcode = '40001'; end if;
  if record.author_id is null or record.author_id = auth.uid() or record.status = 'withdrawn' then raise exception 'This review cannot be moderated'; end if;
  if next_status not in ('approved','rejected') then raise exception 'Invalid review status'; end if;
  update dining_private.reviews set status = next_status, published_at = case when next_status = 'approved' then now() end, version = version + 1 where id = review_id;
  insert into dining_private.moderation_events (review_id, actor_id, action, reason) values (review_id, auth.uid(), next_status, btrim(reason));
end;
$$;

-- Functions default to PUBLIC execute in Postgres. Revoke explicitly, including Supabase role defaults.
revoke all on all functions in schema dining_private from public, anon, authenticated;
revoke all on function public.dining_editor_access() from public, anon, authenticated;
revoke all on function public.dining_public_catalog() from public, anon, authenticated;
revoke all on function public.dining_editor_queue() from public, anon, authenticated;
revoke all on function public.dining_record_official_fact(uuid, integer, text, text, text) from public, anon, authenticated;
revoke all on function public.dining_moderate_restaurant(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.dining_submit_review(uuid, text, integer, text, date) from public, anon, authenticated;
revoke all on function public.dining_withdraw_review(uuid) from public, anon, authenticated;
revoke all on function public.dining_moderate_review(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.dining_public_catalog() to anon, authenticated;
grant execute on function public.dining_editor_access() to authenticated;
grant execute on function public.dining_editor_queue() to authenticated;
grant execute on function public.dining_record_official_fact(uuid, integer, text, text, text) to authenticated;
grant execute on function public.dining_moderate_restaurant(uuid, integer, text, text) to authenticated;
-- Review APIs intentionally have NO client execute grants until privacy, moderation UI,
-- account erasure/retention rules and abuse controls are separately approved and tested.
commit;

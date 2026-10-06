-- IDENTITY-AWARE PRIVATE PILOT PROPOSAL. No real identity data is included or collected by this file.
-- UNAPPLIED PROPOSAL. Generated with Supabase CLI migration new, moved here for review.
-- Private, allowlisted pilot only. No public catalog/reviews, v1 RPCs, auth users or existing gates changed.
-- All new client grants remain REVOKED. Activation requires separately reviewed explicit grants/membership.
begin;
create table dining_private.review_pilot_settings (
  id boolean primary key default true check (id), enabled boolean not null default false,
  policy_approved boolean not null default false, policy_version text not null default 'pilot-draft-v1',
  starts_at timestamptz, ends_at timestamptz,
  check (length(policy_version) between 1 and 100),
  check (not enabled or (policy_approved and starts_at is not null and ends_at > starts_at and ends_at <= starts_at + interval '30 days'))
);
insert into dining_private.review_pilot_settings(id) values (true);
create table dining_private.review_pilot_members (user_id uuid primary key references auth.users(id) on delete cascade, expires_at timestamptz not null);
-- Fixed initial pilot cap. Expansion to a public 100-person cohort is a separate rollout.
create function dining_private.limit_pilot_members() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(81264000);
 if (select count(*) from dining_private.review_pilot_members)>=10 then raise exception 'Pilot is limited to ten participants' using errcode='54000'; end if;
 return new;
end;
$$;
create trigger limit_pilot_members before insert on dining_private.review_pilot_members for each row execute function dining_private.limit_pilot_members();
create table dining_private.review_pilot_restaurants (restaurant_id uuid primary key references dining_private.restaurants(id) on delete cascade);
create table dining_private.pilot_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 company_name text not null check(length(btrim(company_name)) between 1 and 160),
 full_name text not null check(length(btrim(full_name)) between 1 and 100),
 actual_title text not null check(length(btrim(actual_title)) between 1 and 100),
 industry text not null check(industry in ('pharmaceutical','healthcare','manufacturing','technology','finance','professional','hospitality','public_sector','other')),
 company_size text not null check(company_size in ('large','medium','small','independent','undisclosed')),
 role_layer text not null check(role_layer in ('executive','department','team','professional','other')),
 family_initial text not null check(family_initial ~ '^[A-Z]$'), given_initial text not null check(given_initial ~ '^[A-Z]$'),
 version integer not null default 1 check(version>0), public_consented boolean not null default false,
 accepted_policy_version text not null, consented_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Display entitlement only. This table confers NO editorial/administrative permissions.
create table dining_private.pilot_operator_badges (user_id uuid primary key references auth.users(id) on delete cascade, badge text not null default 'Owner' check(badge='Owner'));
alter table dining_private.pilot_profiles enable row level security;
alter table dining_private.pilot_operator_badges enable row level security;
revoke all on dining_private.pilot_profiles,dining_private.pilot_operator_badges from public,anon,authenticated;

create table dining_private.pilot_reviews (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references dining_private.restaurants(id) on delete cascade,
  author_id uuid not null references dining_private.pilot_profiles(user_id) on delete cascade,
  author_snapshot jsonb not null, rating integer not null check (rating between 1 and 5),
  comment text not null check (length(btrim(comment)) between 10 and 2000),
  visited_month date not null check (extract(day from visited_month)=1),
  relationship text not null check (relationship in ('customer','invited','affiliated')),
  accepted_policy_version text not null, consented_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  version integer not null default 1 check (version > 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (restaurant_id,author_id)
);
create index pilot_reviews_author_idx on dining_private.pilot_reviews(author_id,created_at);
create table dining_private.pilot_feedback (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references dining_private.pilot_profiles(user_id) on delete cascade,
  restaurant_id uuid not null references dining_private.restaurants(id) on delete cascade,
  review_id uuid references dining_private.pilot_reviews(id) on delete cascade,
  kind text not null check (kind in ('report','correction')), category text not null, official_url text,
  detail text not null check (length(btrim(detail)) between 10 and 2000), accepted_policy_version text not null,
  status text not null default 'received' check (status in ('received','resolved','dismissed')),
  version integer not null default 1 check (version > 0), created_at timestamptz not null default now(),
  check ((kind='report' and review_id is not null and category in ('privacy','non_visit','relationship','abuse','spam','other') and official_url is null)
      or (kind='correction' and review_id is null and category in ('name','address','website','genre','private_room','price','hours','access','coordinates','notice') and official_url ~ '^https://[^[:space:]@]+$' and length(official_url)<=2000))
);
create index pilot_feedback_author_idx on dining_private.pilot_feedback(author_id,created_at);
create table dining_private.pilot_requests (
  actor_id uuid not null references auth.users(id) on delete cascade, operation text not null, request_id uuid not null,
  input_hash text not null, receipt jsonb not null, created_at timestamptz not null default now(), primary key(actor_id,operation,request_id)
);
create index pilot_requests_rate_idx on dining_private.pilot_requests(actor_id,created_at);
create table dining_private.pilot_events (
  id bigint generated always as identity primary key, review_id uuid references dining_private.pilot_reviews(id) on delete cascade,
  feedback_id uuid references dining_private.pilot_feedback(id) on delete cascade, actor_id uuid references auth.users(id) on delete set null,
  action text not null, reason text not null check(length(btrim(reason)) between 1 and 1000), created_at timestamptz not null default now(),
  check (num_nonnulls(review_id,feedback_id)=1)
);
alter table dining_private.review_pilot_settings enable row level security;
alter table dining_private.review_pilot_members enable row level security;
alter table dining_private.review_pilot_restaurants enable row level security;
alter table dining_private.pilot_reviews enable row level security;
alter table dining_private.pilot_feedback enable row level security;
alter table dining_private.pilot_requests enable row level security;
alter table dining_private.pilot_events enable row level security;
revoke all on dining_private.review_pilot_settings,dining_private.review_pilot_members,dining_private.review_pilot_restaurants,dining_private.pilot_reviews,dining_private.pilot_feedback,dining_private.pilot_requests,dining_private.pilot_events from public,anon,authenticated;

create function dining_private.pilot_signed_in() returns boolean language sql stable set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid());
$$;
create function dining_private.pilot_editor() returns boolean language sql stable set search_path='' as $$
 select dining_private.pilot_signed_in() and exists(select 1 from dining_private.editors where user_id=auth.uid());
$$;
create function dining_private.pilot_open() returns boolean language sql stable set search_path='' as $$
 select dining_private.pilot_signed_in() and exists(select 1 from dining_private.review_pilot_settings where enabled and policy_approved and now() between starts_at and ends_at)
 and exists(select 1 from dining_private.review_pilot_members where user_id=auth.uid() and expires_at>now());
$$;
create function dining_private.pilot_eligible(target uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from dining_private.restaurants r join dining_private.review_pilot_restaurants p on p.restaurant_id=r.id where r.id=target and r.status='verified')
 and (select count(*) from dining_private.restaurant_facts f join dining_private.restaurant_sources s on s.id=f.source_id and s.restaurant_id=f.restaurant_id
 where f.restaurant_id=target and f.field in ('name','address','website') and s.provider='official' and s.publication_basis='facts_only' and s.verified_at is not null and s.license_reviewed_at is not null)=3;
$$;
create function dining_private.pilot_require_open(policy text) returns void language plpgsql set search_path='' as $$
begin
 if not dining_private.pilot_open() then raise exception 'Private pilot closed' using errcode='42501'; end if;
 if policy is null or policy<>(select policy_version from dining_private.review_pilot_settings) then raise exception 'Policy version mismatch' using errcode='22023'; end if;
end;
$$;
create function dining_private.pilot_begin(op text, req uuid, payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare previous dining_private.pilot_requests;
begin
 if not dining_private.pilot_signed_in() then raise exception 'Sign in required' using errcode='42501'; end if;
 if req is null then raise exception 'Request ID required' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select * into previous from dining_private.pilot_requests where actor_id=auth.uid() and operation=op and request_id=req;
 if found then
   if previous.input_hash<>encode(sha256(convert_to(payload::text,'UTF8')),'hex') then raise exception 'Request ID reused for different input' using errcode='22023'; end if;
   return previous.receipt;
 end if;
 return null;
end;
$$;
create function dining_private.pilot_finish(op text, req uuid, payload jsonb, result jsonb) returns jsonb language plpgsql set search_path='' as $$
begin
 insert into dining_private.pilot_requests(actor_id,operation,request_id,input_hash,receipt) values(auth.uid(),op,req,encode(sha256(convert_to(payload::text,'UTF8')),'hex'),result);
 return result;
end;
$$;
create function dining_private.pilot_limit(ops text[], maximum integer) returns void language plpgsql set search_path='' as $$
begin
 if (select count(*) from dining_private.pilot_requests where actor_id=auth.uid() and operation=any(ops) and created_at>now()-interval '1 day')>=maximum then raise exception 'Pilot daily limit' using errcode='54000'; end if;
end;
$$;
create function dining_private.pilot_label(industry text, size text, layer text, family text, given text) returns text language sql immutable set search_path='' as $$
 select (case industry when 'pharmaceutical' then '製薬業界' when 'healthcare' then '医療・福祉' when 'manufacturing' then '製造業' when 'technology' then 'IT・情報通信' when 'finance' then '金融・保険' when 'professional' then '専門サービス' when 'hospitality' then '飲食・宿泊' when 'public_sector' then '公共・教育' when 'other' then 'その他の業種' end)||'・'||
 (case size when 'large' then '大規模企業' when 'medium' then '中規模企業' when 'small' then '小規模企業' when 'independent' then '個人・フリーランス' when 'undisclosed' then '規模非公開' end)||' / '||
 (case layer when 'executive' then '経営・事業統括' when 'department' then '部門マネジメント' when 'team' then 'チームマネジメント' when 'professional' then '専門職・実務担当' when 'other' then 'その他' end)||' / '||family||'・'||given;
$$;
create function dining_private.pilot_operator_badge(target uuid) returns text language sql stable set search_path='' as $$
 select badge from dining_private.pilot_operator_badges where user_id=target;
$$;
create function dining_private.pilot_profile_ready() returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from dining_private.pilot_profiles p cross join dining_private.review_pilot_settings s where p.user_id=auth.uid() and p.public_consented and p.accepted_policy_version=s.policy_version);
$$;
create function dining_private.pilot_author_snapshot(target uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('profileVersion',p.version,'industry',p.industry,'companySize',p.company_size,'roleLayer',p.role_layer,'initials',p.family_initial||'・'||p.given_initial,
 'label',dining_private.pilot_label(p.industry,p.company_size,p.role_layer,p.family_initial,p.given_initial),'declaration','self_declared','operatorAtSubmission',dining_private.pilot_operator_badge(target) is not null)
 from dining_private.pilot_profiles p where p.user_id=target and p.public_consented;
$$;
create function public.dining_my_profile_v2() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not dining_private.pilot_signed_in() then raise exception 'Sign in required' using errcode='42501'; end if;
 -- Owner-only private response. No target-user argument, editor override or metadata authority.
 return (select jsonb_build_object('companyName',company_name,'fullName',full_name,'actualTitle',actual_title,'version',version,'publicConsented',public_consented,'publicAuthor',dining_private.pilot_author_snapshot(user_id),'operatorBadge',dining_private.pilot_operator_badge(user_id)) from dining_private.pilot_profiles where user_id=auth.uid());
end;
$$;
create function public.dining_save_profile_v2(expected_version integer, request_id uuid, accepted_policy_version text, company_name text, full_name text, actual_title text, industry text, company_size text, role_layer text, family_romanization text, given_romanization text, expected_public_label text, private_storage_consent boolean, public_label_consent boolean, romanization_confirmed boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare payload jsonb; cached jsonb; p dining_private.pilot_profiles; label text; ver integer;
begin
 perform dining_private.pilot_require_open(accepted_policy_version);
 payload:=jsonb_build_array(expected_version,accepted_policy_version,company_name,full_name,actual_title,industry,company_size,role_layer,family_romanization,given_romanization,expected_public_label,private_storage_consent,public_label_consent,romanization_confirmed);
 cached:=dining_private.pilot_begin('profile',request_id,payload); if cached is not null then return cached; end if;
 if private_storage_consent is not true or public_label_consent is not true or romanization_confirmed is not true then raise exception 'Separate consents required' using errcode='22023'; end if;
 if family_romanization is null or given_romanization is null or btrim(family_romanization) !~ '^[A-Za-z][A-Za-z ''-]{0,79}$' or btrim(given_romanization) !~ '^[A-Za-z][A-Za-z ''-]{0,79}$' then raise exception 'Confirmed romanization required' using errcode='22023'; end if;
 label:=dining_private.pilot_label(industry,company_size,role_layer,upper(left(btrim(family_romanization),1)),upper(left(btrim(given_romanization),1)));
 if label is null or expected_public_label is distinct from label then raise exception 'Public label preview mismatch' using errcode='22023'; end if;
 select * into p from dining_private.pilot_profiles where user_id=auth.uid() for update;
 if expected_version is null or (found and p.version<>expected_version) or (not found and expected_version<>0) then raise exception 'Stale profile' using errcode='40001'; end if;
 perform dining_private.pilot_limit(array['profile'],5);
 ver:=coalesce(p.version,0)+1;
 insert into dining_private.pilot_profiles(user_id,company_name,full_name,actual_title,industry,company_size,role_layer,family_initial,given_initial,version,public_consented,accepted_policy_version)
 values(auth.uid(),btrim(company_name),btrim(full_name),btrim(actual_title),industry,company_size,role_layer,upper(left(btrim(family_romanization),1)),upper(left(btrim(given_romanization),1)),ver,true,accepted_policy_version)
 on conflict(user_id) do update set company_name=excluded.company_name,full_name=excluded.full_name,actual_title=excluded.actual_title,industry=excluded.industry,company_size=excluded.company_size,role_layer=excluded.role_layer,family_initial=excluded.family_initial,given_initial=excluded.given_initial,version=excluded.version,public_consented=true,accepted_policy_version=excluded.accepted_policy_version,consented_at=now(),updated_at=now();
 -- No full romanization is stored. Old reviews retain their consented, public-only snapshot.
 return dining_private.pilot_finish('profile',request_id,payload,jsonb_build_object('version',ver,'status','saved','requestId',request_id));
end;
$$;
create function public.dining_revoke_profile_publication_v2(expected_version integer, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(expected_version); cached jsonb; p dining_private.pilot_profiles;
begin
 cached:=dining_private.pilot_begin('revoke_profile',request_id,payload); if cached is not null then return cached; end if;
 select * into p from dining_private.pilot_profiles where user_id=auth.uid() for update;
 if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
 if expected_version is null or p.version<>expected_version then raise exception 'Stale profile' using errcode='40001'; end if;
 update dining_private.pilot_profiles set public_consented=false,version=version+1,updated_at=now() where user_id=auth.uid();
 update dining_private.pilot_reviews set status='withdrawn',version=version+1,updated_at=now() where author_id=auth.uid();
 return dining_private.pilot_finish('revoke_profile',request_id,payload,jsonb_build_object('version',p.version+1,'status','revoked','requestId',request_id));
end;
$$;
create function public.dining_delete_my_profile_v2(expected_version integer, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(expected_version); cached jsonb; p dining_private.pilot_profiles;
begin
 cached:=dining_private.pilot_begin('delete_profile',request_id,payload); if cached is not null then return cached; end if;
 select * into p from dining_private.pilot_profiles where user_id=auth.uid() for update;
 if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
 if expected_version is null or p.version<>expected_version then raise exception 'Stale profile' using errcode='40001'; end if;
 delete from dining_private.pilot_profiles where user_id=auth.uid(); -- Cascades reviews/feedback/events.
 delete from dining_private.pilot_requests where actor_id=auth.uid(); -- Remove old payload fingerprints, retain only this receipt.
 return dining_private.pilot_finish('delete_profile',request_id,payload,jsonb_build_object('status','deleted','requestId',request_id));
end;
$$;

create function dining_private.pilot_review_json(v dining_private.pilot_reviews) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',v.id,'restaurantId',v.restaurant_id,'status',v.status,'version',v.version,'displayName',v.author_snapshot->>'label','authorSnapshot',v.author_snapshot,'operatorBadge',dining_private.pilot_operator_badge(v.author_id),'visitedMonth',to_char(v.visited_month,'YYYY-MM'),'relationship',v.relationship,'rating',v.rating,'comment',v.comment);
$$;
create function public.dining_review_capabilities_v2() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('contractVersion',2,'signedIn',dining_private.pilot_signed_in(),'acceptingProfiles',dining_private.pilot_open(),'profileReady',dining_private.pilot_profile_ready(),'profileVersion',coalesce((select version from dining_private.pilot_profiles where user_id=auth.uid()),0),'operatorBadge',dining_private.pilot_operator_badge(auth.uid()),'publicAuthor',dining_private.pilot_author_snapshot(auth.uid()),'acceptingReviews',dining_private.pilot_open() and dining_private.pilot_profile_ready(),'acceptingReports',dining_private.pilot_open() and dining_private.pilot_profile_ready(),'acceptingCorrections',dining_private.pilot_open() and dining_private.pilot_profile_ready(),'canManageOwn',dining_private.pilot_signed_in(),'canModerate',dining_private.pilot_editor(),'policyVersion',(select policy_version from dining_private.review_pilot_settings),'privatePilot',true);
$$;
create function public.dining_review_pilot_catalog_v2() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not (dining_private.pilot_open() or dining_private.pilot_editor()) then raise exception 'Pilot access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'status','verified','name',n.value,'address',a.value,'verifiedAt',r.verified_at,'facts',dining_private.fact_json(r.id),'reviews','[]'::jsonb) order by n.value),'[]'::jsonb)
 from dining_private.restaurants r join dining_private.restaurant_facts n on n.restaurant_id=r.id and n.field='name' join dining_private.restaurant_facts a on a.restaurant_id=r.id and a.field='address' where dining_private.pilot_eligible(r.id));
end;
$$;
create function public.dining_my_reviews_v2() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not dining_private.pilot_signed_in() then raise exception 'Sign in required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(dining_private.pilot_review_json(v) order by v.created_at desc),'[]'::jsonb) from dining_private.pilot_reviews v where v.author_id=auth.uid());
end;
$$;
create function public.dining_review_queue_v2() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not dining_private.pilot_editor() then raise exception 'Editor access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(dining_private.pilot_review_json(v)||jsonb_build_object('authorId',v.author_id) order by v.created_at),'[]'::jsonb) from dining_private.pilot_reviews v);
end;
$$;
create function public.dining_submit_review_v2(restaurant_id uuid, request_id uuid, accepted_policy_version text, profile_version integer, rating integer, comment text, visited_month date, relationship text, has_visited boolean, privacy_checked boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare payload jsonb; cached jsonb; id uuid;
begin
 perform dining_private.pilot_require_open(accepted_policy_version);
 payload:=jsonb_build_array(restaurant_id,accepted_policy_version,profile_version,rating,comment,visited_month,relationship,has_visited,privacy_checked);
 cached:=dining_private.pilot_begin('submit',request_id,payload); if cached is not null then return cached; end if;
 if not dining_private.pilot_profile_ready() or profile_version is null or profile_version<>(select version from dining_private.pilot_profiles where user_id=auth.uid()) then raise exception 'Profile confirmation required' using errcode='22023'; end if;
 if not dining_private.pilot_eligible(restaurant_id) then raise exception 'Eligible pilot restaurant required' using errcode='22023'; end if;
 if has_visited is not true or privacy_checked is not true or visited_month is null or visited_month>current_date or visited_month<date '2000-01-01' then raise exception 'Visit declarations required' using errcode='22023'; end if;
 perform dining_private.pilot_limit(array['submit','revise'],5);
 -- Global cap bounds queue size and storage for the explicitly small pilot. Not a scale-ready quota.
 perform pg_advisory_xact_lock(81264001);
 if (select count(*) from dining_private.pilot_reviews)>=100 then raise exception 'Pilot review capacity' using errcode='54000'; end if;
 insert into dining_private.pilot_reviews(restaurant_id,author_id,author_snapshot,rating,comment,visited_month,relationship,accepted_policy_version)
 values(restaurant_id,auth.uid(),dining_private.pilot_author_snapshot(auth.uid()),rating,btrim(comment),visited_month,relationship,accepted_policy_version) returning pilot_reviews.id into id;
 insert into dining_private.pilot_events(review_id,actor_id,action,reason) values(id,auth.uid(),'submit','Author submitted for private pilot review');
 return dining_private.pilot_finish('submit',request_id,payload,jsonb_build_object('id',id,'status','pending','version',1,'requestId',request_id));
end;
$$;
create function public.dining_revise_review_v2(review_id uuid, expected_version integer, request_id uuid, accepted_policy_version text, profile_version integer, rating integer, comment text, visited_month date, relationship text, has_visited boolean, privacy_checked boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare payload jsonb; cached jsonb; v dining_private.pilot_reviews;
begin
 perform dining_private.pilot_require_open(accepted_policy_version);
 payload:=jsonb_build_array(review_id,expected_version,accepted_policy_version,profile_version,rating,comment,visited_month,relationship,has_visited,privacy_checked);
 cached:=dining_private.pilot_begin('revise',request_id,payload); if cached is not null then return cached; end if;
 select * into v from dining_private.pilot_reviews where id=review_id and author_id=auth.uid() for update;
 if not found then raise exception 'Review access denied' using errcode='42501'; end if;
 if expected_version is null or v.version<>expected_version then raise exception 'Stale review' using errcode='40001'; end if;
 if not dining_private.pilot_profile_ready() or profile_version is null or profile_version<>(select version from dining_private.pilot_profiles where user_id=auth.uid()) then raise exception 'Profile confirmation required' using errcode='22023'; end if;
 if not dining_private.pilot_eligible(v.restaurant_id) or has_visited is not true or privacy_checked is not true or visited_month is null or visited_month>current_date or visited_month<date '2000-01-01' then raise exception 'Visit declarations required' using errcode='22023'; end if;
 perform dining_private.pilot_limit(array['submit','revise'],5);
 update dining_private.pilot_reviews set author_snapshot=dining_private.pilot_author_snapshot(auth.uid()),rating=dining_revise_review_v2.rating,comment=btrim(dining_revise_review_v2.comment),visited_month=dining_revise_review_v2.visited_month,relationship=dining_revise_review_v2.relationship,accepted_policy_version=dining_revise_review_v2.accepted_policy_version,consented_at=now(),status='pending',version=version+1,updated_at=now() where id=review_id;
 insert into dining_private.pilot_events(review_id,actor_id,action,reason) values(review_id,auth.uid(),'revise','Author correction; new moderation required');
 return dining_private.pilot_finish('revise',request_id,payload,jsonb_build_object('id',review_id,'status','pending','version',v.version+1,'requestId',request_id));
end;
$$;
create function public.dining_withdraw_review_v2(review_id uuid, expected_version integer, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(review_id,expected_version); cached jsonb; v dining_private.pilot_reviews;
begin
 cached:=dining_private.pilot_begin('withdraw',request_id,payload); if cached is not null then return cached; end if;
 select * into v from dining_private.pilot_reviews where id=review_id and author_id=auth.uid() for update;
 if not found then raise exception 'Review access denied' using errcode='42501'; end if;
 if expected_version is null or v.version<>expected_version then raise exception 'Stale review' using errcode='40001'; end if;
 update dining_private.pilot_reviews set status='withdrawn',version=version+1,updated_at=now() where id=review_id;
 insert into dining_private.pilot_events(review_id,actor_id,action,reason) values(review_id,auth.uid(),'withdraw','Author withdrawal');
 return dining_private.pilot_finish('withdraw',request_id,payload,jsonb_build_object('id',review_id,'status','withdrawn','version',v.version+1,'requestId',request_id));
end;
$$;
create function public.dining_moderate_review_v2(review_id uuid, expected_version integer, next_status text, reason text, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(review_id,expected_version,next_status,reason); cached jsonb; v dining_private.pilot_reviews;
begin
 if not dining_private.pilot_editor() then raise exception 'Editor access required' using errcode='42501'; end if;
 cached:=dining_private.pilot_begin('moderate',request_id,payload); if cached is not null then return cached; end if;
 select * into v from dining_private.pilot_reviews where id=review_id for update;
 if not found or expected_version is null or v.version<>expected_version then raise exception 'Stale review' using errcode='40001'; end if;
 if v.author_id=auth.uid() or v.status='withdrawn' then raise exception 'Self or withdrawn review' using errcode='42501'; end if;
 if next_status is null or next_status not in ('approved','rejected') or reason is null or length(btrim(reason)) not between 1 and 1000 then raise exception 'Decision and reason required' using errcode='22023'; end if;
 if next_status='approved' and (not dining_private.pilot_eligible(v.restaurant_id) or v.relationship<>'customer') then raise exception 'Pilot approval eligibility' using errcode='22023'; end if;
 update dining_private.pilot_reviews set status=next_status,version=version+1,updated_at=now() where id=review_id;
 insert into dining_private.pilot_events(review_id,actor_id,action,reason) values(review_id,auth.uid(),next_status,btrim(reason));
 return dining_private.pilot_finish('moderate',request_id,payload,jsonb_build_object('id',review_id,'status',next_status,'version',v.version+1,'requestId',request_id));
end;
$$;
create function public.dining_delete_own_review_v2(review_id uuid, expected_version integer, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(review_id,expected_version); cached jsonb; v dining_private.pilot_reviews;
begin
 cached:=dining_private.pilot_begin('delete',request_id,payload); if cached is not null then return cached; end if;
 select * into v from dining_private.pilot_reviews where id=review_id and author_id=auth.uid() for update;
 if not found then raise exception 'Review access denied' using errcode='42501'; end if;
 if expected_version is null or v.version<>expected_version then raise exception 'Stale review' using errcode='40001'; end if;
 delete from dining_private.pilot_reviews where id=review_id; -- Cascades private review events and associated reports.
 return dining_private.pilot_finish('delete',request_id,payload,jsonb_build_object('id',review_id,'status','deleted','requestId',request_id));
end;
$$;
create function dining_private.pilot_feedback_create(target uuid, review uuid, kind text, category text, url text, detail text, policy text, req uuid) returns jsonb language plpgsql set search_path='' as $$
declare payload jsonb:=jsonb_build_array(target,review,kind,category,url,detail,policy); cached jsonb; id uuid;
begin
 perform dining_private.pilot_require_open(policy);
 if not dining_private.pilot_profile_ready() then raise exception 'Profile confirmation required' using errcode='22023'; end if;
 cached:=dining_private.pilot_begin(kind,req,payload); if cached is not null then return cached; end if;
 if not dining_private.pilot_eligible(target) then raise exception 'Eligible pilot restaurant required' using errcode='22023'; end if;
 if kind='report' and not exists(select 1 from dining_private.pilot_reviews where pilot_reviews.id=review and restaurant_id=target and status='approved') then raise exception 'Report target unavailable' using errcode='22023'; end if;
 perform dining_private.pilot_limit(array['report','correction'],10);
 perform pg_advisory_xact_lock(81264002);
 if (select count(*) from dining_private.pilot_feedback)>=200 then raise exception 'Pilot feedback capacity' using errcode='54000'; end if;
 insert into dining_private.pilot_feedback(author_id,restaurant_id,review_id,kind,category,official_url,detail,accepted_policy_version)
 values(auth.uid(),target,review,kind,category,url,btrim(detail),policy) returning pilot_feedback.id into id;
 insert into dining_private.pilot_events(feedback_id,actor_id,action,reason) values(id,auth.uid(),kind,'Private pilot feedback received');
 return dining_private.pilot_finish(kind,req,payload,jsonb_build_object('id',id,'status','received','requestId',req));
end;
$$;
create function public.dining_report_review_v2(restaurant_id uuid, review_id uuid, request_id uuid, accepted_policy_version text, reason text, detail text) returns jsonb language sql security definer set search_path='' as $$
 select dining_private.pilot_feedback_create(restaurant_id,review_id,'report',reason,null,detail,accepted_policy_version,request_id);
$$;
create function public.dining_suggest_correction_v2(restaurant_id uuid, request_id uuid, accepted_policy_version text, fact_field text, official_url text, detail text) returns jsonb language sql security definer set search_path='' as $$
 select dining_private.pilot_feedback_create(restaurant_id,null,'correction',fact_field,official_url,detail,accepted_policy_version,request_id);
$$;
create function dining_private.pilot_feedback_json(f dining_private.pilot_feedback) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',f.id,'restaurantId',f.restaurant_id,'reviewId',f.review_id,'kind',f.kind,'category',f.category,'sourceUrl',f.official_url,'detail',f.detail,'status',f.status,'version',f.version);
$$;
create function public.dining_my_feedback_v2() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not dining_private.pilot_signed_in() then raise exception 'Sign in required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(dining_private.pilot_feedback_json(f) order by f.created_at desc),'[]'::jsonb) from dining_private.pilot_feedback f where author_id=auth.uid());
end;
$$;
create function public.dining_feedback_queue_v2() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not dining_private.pilot_editor() then raise exception 'Editor access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(dining_private.pilot_feedback_json(f)||jsonb_build_object('authorId',f.author_id) order by f.created_at),'[]'::jsonb) from dining_private.pilot_feedback f);
end;
$$;
create function public.dining_resolve_feedback_v2(feedback_id uuid, expected_version integer, next_status text, reason text, request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(feedback_id,expected_version,next_status,reason); cached jsonb; f dining_private.pilot_feedback;
begin
 if not dining_private.pilot_editor() then raise exception 'Editor access required' using errcode='42501'; end if;
 cached:=dining_private.pilot_begin('resolve',request_id,payload); if cached is not null then return cached; end if;
 select * into f from dining_private.pilot_feedback where id=feedback_id for update;
 if not found or expected_version is null or f.version<>expected_version then raise exception 'Stale feedback' using errcode='40001'; end if;
 if f.author_id=auth.uid() then raise exception 'Self resolution prohibited' using errcode='42501'; end if;
 if next_status is null or next_status not in ('resolved','dismissed') or reason is null or length(btrim(reason)) not between 1 and 1000 then raise exception 'Decision and reason required' using errcode='22023'; end if;
 update dining_private.pilot_feedback set status=next_status,version=version+1 where id=feedback_id;
 insert into dining_private.pilot_events(feedback_id,actor_id,action,reason) values(feedback_id,auth.uid(),next_status,btrim(reason));
 -- Resolving feedback never changes a review or an official fact automatically.
 return dining_private.pilot_finish('resolve',request_id,payload,jsonb_build_object('id',feedback_id,'status',next_status,'version',f.version+1,'requestId',request_id));
end;
$$;
-- Operator-only purge proposal. No client grant or scheduler. Retention approval + deployment required.
create function dining_private.purge_review_pilot() returns void language plpgsql set search_path='' as $$
begin
 delete from dining_private.pilot_requests where actor_id in (select user_id from dining_private.pilot_profiles where created_at<now()-interval '30 days');
 delete from dining_private.pilot_profiles where created_at<now()-interval '30 days';
 delete from dining_private.pilot_reviews where created_at<now()-interval '30 days';
 delete from dining_private.pilot_feedback where created_at<now()-interval '30 days';
 delete from dining_private.pilot_requests where created_at<now()-interval '30 days';
end;
$$;
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='dining_private' and p.proname in ('limit_pilot_members','pilot_signed_in','pilot_editor','pilot_open','pilot_eligible','pilot_require_open','pilot_begin','pilot_finish','pilot_limit','pilot_label','pilot_operator_badge','pilot_profile_ready','pilot_author_snapshot','pilot_review_json','pilot_feedback_create','pilot_feedback_json','purge_review_pilot') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
-- Every new public RPC is unavailable until separately approved explicit activation grants.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('dining_my_profile_v2','dining_save_profile_v2','dining_revoke_profile_publication_v2','dining_delete_my_profile_v2','dining_review_capabilities_v2','dining_review_pilot_catalog_v2','dining_my_reviews_v2','dining_review_queue_v2','dining_submit_review_v2','dining_revise_review_v2','dining_withdraw_review_v2','dining_moderate_review_v2','dining_delete_own_review_v2','dining_report_review_v2','dining_suggest_correction_v2','dining_my_feedback_v2','dining_feedback_queue_v2','dining_resolve_feedback_v2') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
commit;

-- UNAPPLIED owner-only dummy trial extension. Existing Phase A SQL is immutable.
-- No accounts, grants, membership, real identity values, activation dates or publication are configured here.
begin;
create table dining_private.owner_trial_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 owner_id uuid references auth.users(id) on delete set null, starts_at timestamptz, ends_at timestamptz,
 policy_version text not null default 'owner-dummy-trial-2026-10-06-v1',
 check(not enabled or (owner_id is not null and starts_at is not null and ends_at>starts_at and ends_at<=starts_at+interval '14 days'))
);
insert into dining_private.owner_trial_settings(id) values(true);
alter table dining_private.owner_trial_settings enable row level security;
revoke all on dining_private.owner_trial_settings from public,anon,authenticated;
alter table dining_private.pilot_reviews add column test_entry boolean not null default false;
alter table dining_private.pilot_reviews add constraint test_entries_never_approved check(not test_entry or status<>'approved');
create function dining_private.close_trial_on_owner_removal() returns trigger language plpgsql set search_path='' as $$
begin
 if new.owner_id is null then new.enabled:=false; end if;
 return new;
end;
$$;
create trigger close_trial_on_owner_removal before update of owner_id on dining_private.owner_trial_settings for each row execute function dining_private.close_trial_on_owner_removal();
create function dining_private.owner_trial_active() returns boolean language sql stable set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid()) and exists(select 1 from dining_private.owner_trial_settings where owner_id=auth.uid() and enabled and now() between starts_at and ends_at);
$$;
create function dining_private.require_owner_trial(active_required boolean) returns void language plpgsql set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) or not exists(select 1 from dining_private.owner_trial_settings where owner_id=auth.uid()) then raise exception 'Owner trial access required' using errcode='42501'; end if;
 if active_required and not dining_private.owner_trial_active() then raise exception 'Owner trial is closed' using errcode='42501'; end if;
end;
$$;
create function dining_private.require_dummy_profile() returns void language plpgsql set search_path='' as $$
begin
 if exists(select 1 from dining_private.pilot_profiles where user_id=auth.uid() and (company_name<>'架空会社' or full_name<>'架空の人物' or actual_title<>'架空の正式職名' or industry<>'pharmaceutical' or company_size<>'large' or role_layer<>'department' or family_initial<>'K' or given_initial<>'T')) then raise exception 'Existing profile is not trial data' using errcode='42501'; end if;
end;
$$;
-- Candidate facts can be exercised privately only by the configured, active trial owner.
-- General publication still requires the existing verified status + public gate.
create function dining_private.owner_trial_eligible(target uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from dining_private.restaurants r join dining_private.review_pilot_restaurants p on p.restaurant_id=r.id where r.id=target and (r.status='verified' or (r.status='candidate' and dining_private.owner_trial_active())))
 and (select count(*) from dining_private.restaurant_facts f join dining_private.restaurant_sources s on s.id=f.source_id and s.restaurant_id=f.restaurant_id
 where f.restaurant_id=target and f.field in ('name','address','website') and s.provider='official' and s.publication_basis='facts_only' and s.verified_at is not null and s.license_reviewed_at is not null)=3;
$$;
create function public.dining_owner_trial_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform dining_private.require_owner_trial(false);
 return public.dining_review_capabilities_v2()||jsonb_build_object('ownerTrial',true,'dummyOnly',true,'active',dining_private.owner_trial_active(),'endsAt',(select ends_at from dining_private.owner_trial_settings));
end;
$$;
create function public.dining_owner_trial_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform dining_private.require_owner_trial(true);
 return (select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'status',r.status,'privatePilot',true,'name',n.value,'address',a.value,'factsCheckedAt',(select max(verified_at) from dining_private.restaurant_facts where restaurant_id=r.id),'facts',dining_private.fact_json(r.id)) order by n.value),'[]'::jsonb)
 from dining_private.restaurants r join dining_private.restaurant_facts n on n.restaurant_id=r.id and n.field='name' join dining_private.restaurant_facts a on a.restaurant_id=r.id and a.field='address' where dining_private.owner_trial_eligible(r.id));
end;
$$;
create function public.dining_owner_trial_profile() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform dining_private.require_owner_trial(false); perform dining_private.require_dummy_profile();
 return (select jsonb_build_object('version',version,'publicConsented',public_consented,'publicAuthor',dining_private.pilot_author_snapshot(user_id)) from dining_private.pilot_profiles where user_id=auth.uid());
end;
$$;
create function public.dining_owner_trial_prepare_profile(expected_version integer,request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare policy text;
begin
 perform dining_private.require_owner_trial(true); perform dining_private.require_dummy_profile();
 select policy_version into policy from dining_private.owner_trial_settings;
 return public.dining_save_profile_v2(expected_version,request_id,policy,'架空会社','架空の人物','架空の正式職名','pharmaceutical','large','department','Kensho','Taro','製薬業界・大規模企業 / 部門マネジメント / K・T',true,true,true);
end;
$$;
create function public.dining_owner_trial_my_reviews() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform dining_private.require_owner_trial(false);
 return (select coalesce(jsonb_agg(dining_private.pilot_review_json(v)||jsonb_build_object('testEntry',true) order by v.created_at desc),'[]'::jsonb) from dining_private.pilot_reviews v where v.author_id=auth.uid() and v.test_entry);
end;
$$;
create function public.dining_owner_trial_submit(restaurant_id uuid,expected_profile_version integer,request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(restaurant_id,expected_profile_version); cached jsonb; result_id uuid; policy text;
begin
 perform dining_private.require_owner_trial(true); perform dining_private.require_dummy_profile();
 select policy_version into policy from dining_private.owner_trial_settings; perform dining_private.pilot_require_open(policy);
 cached:=dining_private.pilot_begin('owner_trial_submit',request_id,payload); if cached is not null then return cached; end if;
 if not dining_private.pilot_profile_ready() or expected_profile_version is null or expected_profile_version<>(select version from dining_private.pilot_profiles where user_id=auth.uid()) then raise exception 'Profile confirmation required' using errcode='22023'; end if;
 if not dining_private.owner_trial_eligible(restaurant_id) then raise exception 'Eligible trial restaurant required' using errcode='22023'; end if;
 perform dining_private.pilot_limit(array['submit','revise'],5); perform pg_advisory_xact_lock(81264001);
 if (select count(*) from dining_private.pilot_reviews)>=100 then raise exception 'Pilot review capacity' using errcode='54000'; end if;
 insert into dining_private.pilot_reviews(restaurant_id,author_id,author_snapshot,rating,comment,visited_month,relationship,accepted_policy_version,test_entry)
 values(restaurant_id,auth.uid(),dining_private.pilot_author_snapshot(auth.uid()),3,'これは操作確認用の非公開テスト投稿です。実際の来店体験・店舗の評価ではありません。',date_trunc('month',now() at time zone 'Asia/Tokyo')::date,'customer',policy,true) returning id into result_id;
 insert into dining_private.pilot_events(review_id,actor_id,action,reason) values(result_id,auth.uid(),'owner_trial_submit','Dummy test, never an actual visit or public review');
 return dining_private.pilot_finish('owner_trial_submit',request_id,payload,jsonb_build_object('id',result_id,'status','pending','version',1,'requestId',request_id,'testEntry',true));
end;
$$;
create function public.dining_owner_trial_withdraw(review_id uuid,expected_version integer,request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform dining_private.require_owner_trial(false);
 if not exists(select 1 from dining_private.pilot_reviews where id=review_id and author_id=auth.uid() and test_entry) then raise exception 'Trial review access denied' using errcode='42501'; end if;
 return public.dining_withdraw_review_v2(review_id,expected_version,request_id);
end;
$$;
create function public.dining_owner_trial_queue() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform dining_private.require_owner_trial(true);
 if not dining_private.pilot_editor() then raise exception 'Editor access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(dining_private.pilot_review_json(v)||jsonb_build_object('testEntry',true) order by v.created_at desc),'[]'::jsonb) from dining_private.pilot_reviews v where v.author_id=auth.uid() and v.test_entry);
end;
$$;
create function public.dining_owner_trial_delete_profile(expected_version integer,request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform dining_private.require_owner_trial(false); perform dining_private.require_dummy_profile();
 if exists(select 1 from dining_private.pilot_reviews where author_id=auth.uid() and not test_entry) then raise exception 'Non-trial reviews require separate account management' using errcode='42501'; end if;
 return public.dining_delete_my_profile_v2(expected_version,request_id);
end;
$$;
-- No new client access by default. Only the nine owner wrappers may be granted in a separately approved activation.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='public' and p.proname in ('dining_owner_trial_context','dining_owner_trial_catalog','dining_owner_trial_profile','dining_owner_trial_prepare_profile','dining_owner_trial_my_reviews','dining_owner_trial_submit','dining_owner_trial_withdraw','dining_owner_trial_queue','dining_owner_trial_delete_profile'))
 or (n.nspname='dining_private' and p.proname in ('close_trial_on_owner_removal','owner_trial_active','owner_trial_eligible','require_owner_trial','require_dummy_profile')) loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
commit;

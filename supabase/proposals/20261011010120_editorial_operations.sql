-- PROPOSAL ONLY. Existing editors may inspect publication state and add bounded candidates.
-- No editor enrollment, trial expansion, public gate, review gate, or auth setting is changed.
begin;
create function public.dining_editor_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.dining_editor_access() then raise exception 'Editor access required' using errcode='42501'; end if;
 return (select jsonb_build_object('contractVersion',1,'publicEnabled',public_enabled,'reviewsEnabled',reviews_enabled,'manualIntakeEnabled',has_function_privilege('authenticated','public.dining_create_candidate(text,text,text,uuid)','EXECUTE'),'queueLimit',200) from dining_private.settings);
end;
$$;
create function public.dining_create_candidate(candidate_name text,candidate_address text,official_url text,request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare existing dining_private.restaurants; result uuid; key text; saved jsonb; payload jsonb;
begin
 if not public.dining_editor_access() then raise exception 'Editor access required' using errcode='42501'; end if;
 if request_id is null or candidate_name is null or length(btrim(dining_create_candidate.candidate_name)) not between 1 and 200 or candidate_address is null or length(btrim(dining_create_candidate.candidate_address)) not between 1 and 500 or candidate_address not like '%名古屋市%' or official_url is null or length(official_url)>2000 or official_url !~ '^https://[^[:space:]@]+$' then raise exception 'Valid Nagoya candidate and official HTTPS URL required' using errcode='22023'; end if;
 key:='manual:'||auth.uid()::text||':'||request_id::text;
 payload:=jsonb_build_object('name',btrim(dining_create_candidate.candidate_name),'address',btrim(dining_create_candidate.candidate_address),'officialUrl',btrim(official_url));
 -- Serialize this small queue for both its 200-row cap and duplicate detection.
 lock table dining_private.restaurants in share row exclusive mode;
 select * into existing from dining_private.restaurants where import_key=key;
 if found then
  select raw_record into saved from dining_private.restaurant_sources where restaurant_id=existing.id and provider='manual-candidate' order by fetched_at limit 1;
  if saved is distinct from payload then raise exception 'Request ID belongs to a different input' using errcode='22023'; end if;
  return jsonb_build_object('id',existing.id,'status',existing.status,'version',existing.version,'replayed',true);
 end if;
 if exists(select 1 from dining_private.restaurants r where lower(regexp_replace(r.candidate_name,'[[:space:]]','','g'))=lower(regexp_replace(btrim(dining_create_candidate.candidate_name),'[[:space:]]','','g')) and lower(regexp_replace(r.candidate_address,'[[:space:]]','','g'))=lower(regexp_replace(btrim(dining_create_candidate.candidate_address),'[[:space:]]','','g'))) then raise exception 'Candidate already exists' using errcode='23505'; end if;
 if (select count(*) from dining_private.restaurants)>=200 then raise exception 'Editorial queue limit reached' using errcode='54000'; end if;
 if (select count(*) from dining_private.moderation_events where actor_id=auth.uid() and action='create_candidate' and created_at>now()-interval '1 day')>=10 then raise exception 'Daily candidate limit reached' using errcode='54000'; end if;
 insert into dining_private.restaurants(import_key,candidate_name,candidate_address,city) values(key,btrim(dining_create_candidate.candidate_name),btrim(dining_create_candidate.candidate_address),'名古屋市') returning id into result;
 insert into dining_private.restaurant_sources(restaurant_id,provider,source_url,fetched_at,raw_record) values(result,'manual-candidate',btrim(official_url),now(),payload);
 insert into dining_private.moderation_events(restaurant_id,actor_id,action,reason) values(result,auth.uid(),'create_candidate','候補を追加。公式調査と掲載判断は未完了。');
 return jsonb_build_object('id',result,'status','candidate','version',1,'replayed',false);
end;
$$;
-- Match the previewed publication effect atomically with the decision.
create function public.dining_save_listing_decision(restaurant_id uuid,expected_version integer,next_status text,reason text,expected_public_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
declare current_public_enabled boolean;
begin
 if not public.dining_editor_access() then raise exception 'Editor access required' using errcode='42501'; end if;
 select public_enabled into current_public_enabled from dining_private.settings for share;
 if expected_public_enabled is null or current_public_enabled is distinct from expected_public_enabled then raise exception 'Publication setting changed; reload before deciding' using errcode='40001'; end if;
 perform public.dining_moderate_restaurant(restaurant_id,expected_version,next_status,reason);
end;
$$;
revoke all on function public.dining_editor_context() from public,anon,authenticated;
revoke all on function public.dining_create_candidate(text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.dining_save_listing_decision(uuid,integer,text,text,boolean) from public,anon,authenticated;
-- Explicitly included in this reviewable proposal; do not apply without action-time approval.
grant execute on function public.dining_editor_context() to authenticated;
grant execute on function public.dining_create_candidate(text,text,text,uuid) to authenticated;
grant execute on function public.dining_save_listing_decision(uuid,integer,text,text,boolean) to authenticated;
-- The wrapper is the sole client decision entry point; its definer can still call the legacy implementation.
revoke execute on function public.dining_moderate_restaurant(uuid,integer,text,text) from public,anon,authenticated;
commit;

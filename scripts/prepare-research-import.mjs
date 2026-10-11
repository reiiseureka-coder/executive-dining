// Generate a private candidate import FILE. This script never connects to the database.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {decodeResearchBatch} from '../src/domain/researchBatch.ts';
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const id=key=>{const h=createHash('sha256').update(`ExecutiveDining research v1:${key}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
export function prepareResearchImport(input,existing=[]){
 const batch=decodeResearchBatch(input);
 if(!Array.isArray(existing)||existing.some(v=>!v||typeof v.researchId!=='string'||!/^[0-9a-f-]{36}$/i.test(v.id)||typeof v.name!=='string'||typeof v.address!=='string'||!v.address.trim())||new Set(existing.map(v=>v.researchId)).size!==existing.length||new Set(existing.map(v=>v.id.toLowerCase())).size!==existing.length||existing.some(v=>!batch.candidates.some(c=>c.researchId===v.researchId)))throw new Error('Invalid existing-venue mapping');
 const records=batch.candidates.map(candidate=>{const mapping=existing.find(v=>v.researchId===candidate.researchId);if(mapping&&mapping.name!==candidate.name)throw new Error('Research name differs from existing mapping');const sourceUrl=candidate.officialUrl??candidate.facts[0]?.sourceUrl;if(!sourceUrl)throw new Error('Every candidate needs a real research source');return {candidate,existingName:mapping?.name??null,existingAddress:mapping?.address??null,id:mapping?.id??id(candidate.researchId),importKey:`research-v1:${candidate.researchId}`,sourceId:id(`${batch.batchId}:${candidate.researchId}:research`),sourceUrl,facts:candidate.facts.filter(f=>f.confidence==='confirmed'&&f.sourceType==='official').map(f=>({...f,id:id(`${batch.batchId}:${candidate.researchId}:${f.field}`)}))};});
 const payload={batchId:batch.batchId,researchedAt:batch.researchedAt,records};
 const body=`declare
 data jsonb := ${quote(JSON.stringify(payload))}; item jsonb; fact jsonb; snapshot jsonb; c_id uuid; s_id uuid; changed integer;
 begin
 if (select public_enabled or reviews_enabled from dining_private.settings) then raise exception 'Public and review gates must remain OFF for this import'; end if;
 for item in select value from jsonb_array_elements(data->'records') loop
  c_id:=(item->>'id')::uuid; s_id:=(item->>'sourceId')::uuid;
  if item->>'existingName' is not null then
   if not exists(select 1 from dining_private.restaurants where id=c_id and candidate_name=item->>'existingName' and candidate_address=item->>'existingAddress') then raise exception 'Existing restaurant mapping changed'; end if;
  else
   if exists(select 1 from dining_private.restaurants where candidate_name=item->'candidate'->>'name' and candidate_address=item->'candidate'->>'address' and id<>c_id) then raise exception 'Review an existing duplicate before import'; end if;
   if exists(select 1 from dining_private.restaurants where id=c_id and (import_key is distinct from item->>'importKey' or candidate_name is distinct from item->'candidate'->>'name' or candidate_address is distinct from item->'candidate'->>'address')) then raise exception 'Candidate identity changed: review mapping'; end if;
   insert into dining_private.restaurants(id,import_key,candidate_name,candidate_address,city) values(c_id,item->>'importKey',item->'candidate'->>'name',item->'candidate'->>'address','名古屋市') on conflict(id) do nothing;
  end if;
  snapshot:=jsonb_build_object('schemaVersion',1,'batchId',data->>'batchId','researchedAt',data->>'researchedAt','candidate',item->'candidate');
  if exists(select 1 from dining_private.restaurant_sources where id=s_id and raw_record is distinct from snapshot) then raise exception 'Research batch changed: use a new batch ID'; end if;
  insert into dining_private.restaurant_sources(id,restaurant_id,provider,source_url,fetched_at,raw_record) values(s_id,c_id,'editorial-research-v1',item->>'sourceUrl',(data->>'researchedAt')::timestamptz,snapshot) on conflict(id) do nothing;
  get diagnostics changed=row_count;
  -- Replaying a reviewed batch is a strict no-op, including deliberately removed facts.
  if changed>0 then
  for fact in select value from jsonb_array_elements(item->'facts') loop
   -- Never overwrite an existing fact, or add publishable facts to an approved/rejected store.
   if exists(select 1 from dining_private.restaurants where id=c_id and status='candidate') and not exists(select 1 from dining_private.restaurant_facts where restaurant_id=c_id and field=fact->>'field') then
    insert into dining_private.restaurant_sources(id,restaurant_id,provider,source_url,fetched_at,verified_at,publication_basis,license_reviewed_at) values((fact->>'id')::uuid,c_id,'official',fact->>'sourceUrl',(fact->>'checkedAt')::timestamptz,(fact->>'checkedAt')::timestamptz,'facts_only',(fact->>'checkedAt')::timestamptz) on conflict(id) do nothing;
    insert into dining_private.restaurant_facts(restaurant_id,field,value,source_id,verified_at) values(c_id,fact->>'field',fact->>'value',(fact->>'id')::uuid,(fact->>'checkedAt')::timestamptz) on conflict(restaurant_id,field) do nothing;
   end if;
  end loop;
  update dining_private.restaurants set version=version+1,updated_at=now() where id=c_id;
  end if;
 end loop;
 if (select count(*) from dining_private.restaurants)>200 then raise exception 'Editorial queue exceeds 200: no partial import'; end if;
 end`;
 // Single-quoted DO body safely contains untrusted quotes, backslashes and dollar delimiters.
 return ['-- PRIVATE CANDIDATES ONLY. No publication, trial targets, auth or grants are changed.','begin;',"set local lock_timeout='5s';",'set local standard_conforming_strings=on;','lock table dining_private.restaurants in share row exclusive mode;',`do ${quote(body)};`,'commit;',''].join('\n');
}
if(process.argv[1]?.endsWith('prepare-research-import.mjs')){
 const [input,mapping,output]=process.argv.slice(2);if(!input||!mapping||!output)throw new Error('Usage: node scripts/prepare-research-import.mjs research.json existing-map.json output.sql');
 const sql=prepareResearchImport(JSON.parse(await readFile(input,'utf8')),JSON.parse(await readFile(mapping,'utf8')));await writeFile(output,sql,{flag:'wx'});console.log('Prepared private candidate import; no database connection or publication.');
}

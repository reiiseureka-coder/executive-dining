import { FACT_LABELS, safeExternalUrl, type FactField } from './dining.ts';
export interface ResearchFact { field: FactField; value: string; sourceUrl: string; checkedAt: string; sourceType: 'official'|'directory'; confidence: 'confirmed'|'unconfirmed' }
export interface ResearchCandidate { researchId: string; name: string; address: string; area: string; cuisine: string; officialUrl: string|null; facts: ResearchFact[]; unknowns: string[]; ownerDecision: string; researchNotes: string }
export interface ResearchBatch { schemaVersion: 1; batchId: string; researchedAt: string; candidates: ResearchCandidate[] }
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max:number,min=1):v is string=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const url=(v:unknown):v is string=>text(v,2000)&&safeExternalUrl(v)?.startsWith('https:')===true;
export function decodeResearchCandidate(value:unknown):ResearchCandidate {
 if(!object(value)||!text(value.researchId,120)||!/^[a-z0-9][a-z0-9-]+$/.test(value.researchId)||!text(value.name,200)||!text(value.address,500)||!value.address.includes('名古屋市')||!text(value.area,100)||!text(value.cuisine,100)||!(value.officialUrl===null||url(value.officialUrl))||!Array.isArray(value.facts)||value.facts.length>10||!Array.isArray(value.unknowns)||value.unknowns.length>20||!value.unknowns.every(v=>text(v,500))||!text(value.ownerDecision,1000)||!text(value.researchNotes,1500,0))throw new Error('調査候補の形式を確認してください。');
 const facts:ResearchFact[]=value.facts.map(f=>{
  if(!object(f)||typeof f.field!=='string'||!Object.hasOwn(FACT_LABELS,f.field)||!text(f.value,1500)||!url(f.sourceUrl)||!date(f.checkedAt)||!['official','directory'].includes(String(f.sourceType))||!['confirmed','unconfirmed'].includes(String(f.confidence)))throw new Error('調査事実の形式を確認してください。');
  if(f.field==='website'&&!url(f.value))throw new Error('公式サイトのURLを確認してください。');
  return {field:f.field as FactField,value:f.value,sourceUrl:f.sourceUrl,checkedAt:f.checkedAt,sourceType:f.sourceType as ResearchFact['sourceType'],confidence:f.confidence as ResearchFact['confidence']};
 });
 if(new Set(facts.map(f=>f.field)).size!==facts.length)throw new Error('調査項目が重複しています。');
 for(const field of ['name','address','website'] as const){const fact=facts.find(f=>f.field===field&&f.sourceType==='official'&&f.confidence==='confirmed');if(fact&&fact.value!==(field==='website'?value.officialUrl:value[field]))throw new Error('店舗情報と公式の確認記録が一致しません。');}
 return {researchId:value.researchId,name:value.name,address:value.address,area:value.area,cuisine:value.cuisine,officialUrl:value.officialUrl,facts,unknowns:value.unknowns as string[],ownerDecision:value.ownerDecision,researchNotes:value.researchNotes};
}
export function decodeResearchBatch(value:unknown):ResearchBatch {
 if(!object(value)||value.schemaVersion!==1||!text(value.batchId,120)||!/^[a-z0-9][a-z0-9-]+$/.test(value.batchId)||!date(value.researchedAt)||!Array.isArray(value.candidates)||value.candidates.length<1||value.candidates.length>200)throw new Error('調査バッチの形式を確認してください。');
 const candidates=value.candidates.map(decodeResearchCandidate);
 const normalized=(v:string)=>v.normalize('NFKC').replace(/[\s・「」]/g,'').toLowerCase();
 if(new Set(candidates.map(c=>c.researchId)).size!==candidates.length||new Set(candidates.map(c=>normalized(c.name)+'|'+normalized(c.address))).size!==candidates.length)throw new Error('同じ店舗が重複しています。');
 return {schemaVersion:1,batchId:value.batchId,researchedAt:value.researchedAt,candidates};
}

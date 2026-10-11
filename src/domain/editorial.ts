import {FACT_LABELS,factValue,type EditorialRestaurant,type FactField} from './dining.ts';
import {decodeResearchCandidate,type ResearchCandidate} from './researchBatch.ts';
export const EDITORIAL_STATUS={candidate:'判断待ち',verified:'承認済み',rejected:'対象外'} as const;
export function researchFor(row:EditorialRestaurant):ResearchCandidate|null {
 for(const source of [...row.sources].reverse()){
  if(source.provider!=='editorial-research-v1'||!source.rawRecord)continue;
  try{return decodeResearchCandidate(source.rawRecord.candidate);}catch{/* Invalid research never becomes verified facts. */}
 }
 return null;
}
export function editorialAssessment(row:EditorialRestaurant){
 const research=researchFor(row);
 const missingCore=(['name','address','website'] as const).filter(field=>!row.facts.some(f=>f.field===field&&f.provider==='official'&&f.value.trim()));
 const missingOptional=(['private_room','price','hours','access','coordinates'] as FactField[]).filter(field=>!factValue(row,field));
 const unknowns=[...new Set([...(research?.unknowns??[]),...missingOptional.map(field=>`${FACT_LABELS[field]}は未確認`)])];
 const publicEnabled=typeof row.publicEnabled==='boolean'?row.publicEnabled:null;
 return {research,missingCore,unknowns,ready:missingCore.length===0,publicEnabled,cuisine:factValue(row,'genre')??research?.cuisine??'料理未確認',area:research?.area??row.address.replace(/^.*?名古屋市/,'').split(/[\s\d０-９]/)[0],decision:research?.ownerDecision??'この情報と未確認事項を踏まえて、普段の会食候補として掲載するか判断してください。',nextAction:row.status==='verified'?'承認済み':row.status==='rejected'?'対象外':missingCore.length?'公式の基本情報を補う':'あなたの掲載判断'};
}
export function filterEditorial(rows:EditorialRestaurant[],query:string,stage:string,cuisine:string){
 const words=query.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
 return rows.filter(row=>{const a=editorialAssessment(row);const text=[row.name,row.address,a.cuisine,a.area].join(' ').normalize('NFKC').toLowerCase();return words.every(w=>text.includes(w))&&(!cuisine||a.cuisine===cuisine)&&(!stage||(stage==='ready'?row.status==='candidate'&&a.ready:stage==='research'?row.status==='candidate'&&!a.ready:row.status===stage));});
}
export function approvalEffect(row:EditorialRestaurant){const enabled=editorialAssessment(row).publicEnabled;return enabled===false?'承認済みに保存します。一般公開は停止中なので、利用者向けには公開されません。':enabled===true?'承認すると、確認済みの情報が利用者向けの公開一覧に反映されます。':'公開設定を取得できません。承認後の公開範囲を確認するため、管理情報を更新してください。';}

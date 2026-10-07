import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {decodePilotCatalog,searchPilotRestaurants} from '../src/domain/ownerTrial.ts';
import {decodePublishedCatalog} from '../src/domain/dining.ts';
const fixture=JSON.parse(await readFile(new URL('./fixtures/owner-trial-catalog.json',import.meta.url),'utf8'));
test('real ten-store fixture keeps candidate state and reviewed field evidence',()=>{const rows=decodePilotCatalog(fixture);assert.equal(rows.length,10);assert.ok(rows.every(r=>r.status==='candidate'));assert.equal(rows.reduce((n,r)=>n+r.facts.length,0),61);assert.deepEqual(decodePublishedCatalog(fixture),[]);});
test('private search matches actual venue and source text without using public recommendation status',()=>{const rows=decodePilotCatalog(fixture);assert.equal(searchPilotRestaurants(rows,'名古屋浅田 15%','').length,1);assert.equal(searchPilotRestaurants(rows,'架空店舗','').length,0);});
test('private decoding refuses missing official core evidence, public-shaped data and unbounded lists',()=>{assert.throws(()=>decodePilotCatalog([{...fixture[0],privatePilot:false}]));assert.throws(()=>decodePilotCatalog([...fixture,fixture[0]]));assert.throws(()=>decodePilotCatalog([{...fixture[0],facts:fixture[0].facts.filter(f=>f.field!=='website')}]));});
test('actual ten-store search covers empty, all names, combined normalized terms and genre mismatch',()=>{
 const rows=decodePilotCatalog(fixture);
 assert.equal(searchPilotRestaurants(rows,'　 ','').length,10);
 for(const row of rows)assert.ok(searchPilotRestaurants(rows,row.name,'').some(r=>r.id===row.id));
 assert.equal(searchPilotRestaurants(rows,'名古屋浅田　１５％','').length,1);
 assert.equal(searchPilotRestaurants(rows,'名古屋浅田','中国料理・広東料理').length,0);
 assert.equal(searchPilotRestaurants(rows,'存在しない料理xyz','').length,0);
});
test('text matching preserves explicit no and unknown as different evidence',()=>{
 const row=decodePilotCatalog(fixture)[0];
 const absent={...row,facts:row.facts.filter(f=>['name','address','website'].includes(f.field))};
 const explicitNo={...absent,id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',facts:[...absent.facts,{...row.facts[0],field:'private_room',value:'個室なし'}]};
 assert.deepEqual(searchPilotRestaurants([absent,explicitNo],'個室','').map(r=>r.id),[explicitNo.id]);
 assert.equal(absent.facts.some(f=>f.field==='private_room'),false);
});

import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {decodePilotCatalog,searchPilotRestaurants} from '../src/domain/ownerTrial.ts';
import {decodePublishedCatalog} from '../src/domain/dining.ts';
const fixture=JSON.parse(await readFile(new URL('./fixtures/owner-trial-catalog.json',import.meta.url),'utf8'));
test('real ten-store fixture keeps candidate state and reviewed field evidence',()=>{const rows=decodePilotCatalog(fixture);assert.equal(rows.length,10);assert.ok(rows.every(r=>r.status==='candidate'));assert.equal(rows.reduce((n,r)=>n+r.facts.length,0),61);assert.deepEqual(decodePublishedCatalog(fixture),[]);});
test('private search matches actual venue and source text without using public recommendation status',()=>{const rows=decodePilotCatalog(fixture);assert.equal(searchPilotRestaurants(rows,'名古屋浅田 15%','').length,1);assert.equal(searchPilotRestaurants(rows,'架空店舗','').length,0);});
test('private decoding refuses missing official core evidence, public-shaped data and unbounded lists',()=>{assert.throws(()=>decodePilotCatalog([{...fixture[0],privatePilot:false}]));assert.throws(()=>decodePilotCatalog([...fixture,fixture[0]]));assert.throws(()=>decodePilotCatalog([{...fixture[0],facts:fixture[0].facts.filter(f=>f.field!=='website')}]));});

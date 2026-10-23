import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { writeFile } from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
  const {default:App}=await server.ssrLoadModule('/src/App.tsx');
  const markup=renderToStaticMarkup(React.createElement(App));
  await writeFile('qa/rendered-home.html',markup);
  assert.equal((markup.match(/<h1/g)||[]).length,1,'One clear page heading');
  assert.equal((markup.match(/class="home-catalog-card home-inspiration-card"/g)||[]).length,3,'Three lightweight exploration links');
  assert.equal((markup.match(/<img /g)||[]).length,1,'Home uses one editorial photo, not repeated generated cards');
  assert.ok(markup.includes('role="search"'),'Search landmark retained');
  assert.ok(markup.includes('招待済みの方はログイン'),'Adjacent invitation login retained');
  assert.ok(!markup.includes('city-list'),'Unavailable city grid removed');
  assert.equal((markup.match(/<details/g)||[]).length,3,'Ancillary explanations collapsed');
  const {default:Summary}=await server.ssrLoadModule('/src/components/CatalogSummary.tsx');
  const facts=[{field:'price',value:'コース 12,000円。サービス料10%別。2名以上、3日前までに予約。'},{field:'private_room',value:'個室なし'},{field:'notice',value:'休業予定を公式サイトで確認してください。'}];
  const summary=renderToStaticMarkup(React.createElement(Summary,{restaurant:{facts}}));
  assert.ok(summary.includes('コース 12,000円。サービス料10%別。2名以上、3日前までに予約。'),'Full pricing caveats preserved');
  assert.ok(summary.includes('個室なし'),'Negative conditions preserved');
  assert.ok(summary.indexOf('営業のお知らせ')<summary.indexOf('<details'),'Operational notices remain visible, outside disclosure');
  assert.equal((summary.match(/営業のお知らせ/g)||[]).length,1,'Notice not duplicated');
  assert.ok(!summary.includes('<details open'),'Conditions are initially collapsed');
  console.log('PASS: 12 server-rendered structural and factual-fidelity assertions. Browser interaction and visual QA are separate, not covered by this check.');
} finally { await server.close(); }

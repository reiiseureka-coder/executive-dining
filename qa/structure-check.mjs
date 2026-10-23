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
  assert.ok(markup.includes('data-home-state='),'Home exposes its actual availability state');
  assert.equal((markup.match(/<img /g)||[]).length,0,'Decorative hero no longer precedes capability and task');
  assert.ok(!markup.includes('role="search"'),'Unavailable home does not offer a false search');
  assert.ok(!markup.includes('招待済みの方はログイン'),'No unusable invitation CTA when sign-in is not configured');
  assert.ok(!markup.includes('city-list'),'Unavailable city grid removed');
  assert.equal((markup.match(/<details/g)||[]).length,3,'Ancillary explanations collapsed');
  const {default:Summary}=await server.ssrLoadModule('/src/components/CatalogSummary.tsx');
  const facts=[{field:'price',value:'コース 12,000円。サービス料10%別。2名以上、3日前までに予約。'},{field:'private_room',value:'個室なし'},{field:'notice',value:'休業予定を公式サイトで確認してください。'}];
  const summary=renderToStaticMarkup(React.createElement(Summary,{restaurant:{facts}}));
  assert.ok(summary.includes('コース 12,000円。サービス料10%別。2名以上、3日前までに予約。'),'Full pricing caveats preserved');
  assert.ok(summary.includes('個室なし') && !summary.includes('<details'),'Complete negative room statement stays visible outside disclosure');
  assert.ok(summary.indexOf('営業のお知らせ')<summary.indexOf('<dl'),'Operational notices remain visible, outside disclosure');
  assert.equal((summary.match(/営業のお知らせ/g)||[]).length,1,'Notice not duplicated');
  assert.ok(!summary.includes('<details'),'Full price and room conditions visible without expansion');
  console.log('PASS: 12 server-rendered structural and factual-fidelity assertions. Browser interaction and visual QA are separate, not covered by this check.');
} finally { await server.close(); }

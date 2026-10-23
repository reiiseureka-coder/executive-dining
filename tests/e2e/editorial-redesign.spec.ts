import { test, expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { catalog, login, mock } from './helpers/ownerTrial';
const privateBase = 'http://127.0.0.1:4181';
async function typography(locator: Locator) {
  return locator.evaluateAll(elements=>elements.map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {text:el.textContent?.trim(),fontSize:parseFloat(s.fontSize),lineHeight:s.lineHeight,fontWeight:s.fontWeight,top:r.top,width:r.width,height:r.height,visible:r.width>0&&r.height>0};}));
}
async function capture(page:Page,info:TestInfo,name:string) {
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:info.outputPath(`${name}-viewport.png`),fullPage:false,animations:'disabled'});
  await page.screenshot({path:info.outputPath(`${name}.png`),fullPage:true,animations:'disabled'});
}
for (const width of [390,1440]) {
  const height=width===390?844:1000;
  test(`task-first disconnected state and safe repeated dismissal at ${width}px`,async({page},info)=>{
    test.skip(info.project.name!=='desktop','Run each explicit viewport once.');
    await page.setViewportSize({width,height});await page.goto('/');
    await expect(page.locator('[data-home-state="disconnected"]')).toBeVisible();
    await expect(page.getByRole('search')).toHaveCount(0);
    await expect(page.locator('.editorial-home img, .quick-links')).toHaveCount(0);
    await expect(page.getByText('店舗情報は未接続です',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'招待済みの方はログイン',exact:true})).toHaveCount(0);
    for (const summary of await page.locator('.home-guide-list summary').all()) {
      await summary.click();await expect(summary.locator('..')).toHaveAttribute('open','');await summary.click();await expect(summary.locator('..')).not.toHaveAttribute('open','');
    }
    for(let i=0;i<2;i++){
      if(width===390)await page.getByRole('button',{name:'メニューを開く',exact:true}).click();
      await page.getByRole('button',{name:'ログイン',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('ログイン機能は準備中です。',{exact:true})).toBeVisible();
      if(i===0)await page.getByRole('button',{name:'閉じる',exact:true}).click();else await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
    }
    const sizes=await typography(page.locator('.home-state-description, .home-guide-list summary'));
    for(const value of sizes)expect(value.fontSize).toBeGreaterThanOrEqual(16);
    await capture(page,info,`redesign-home-disconnected-${width}`);
    if(width===390)await page.getByRole('button',{name:'メニューを開く',exact:true}).click();
    await page.getByRole('button',{name:'店舗一覧',exact:true}).click();
    await expect(page.getByRole('heading',{name:'この確認用サイトは、店舗データに未接続です'})).toBeVisible();
    await capture(page,info,`redesign-empty-${width}`);
    await page.getByRole('button',{name:'ホームへ戻る',exact:true}).click();await expect(page.locator('.home-find')).toBeVisible();
    await page.goBack();await expect(page.locator('.catalog-connection-state')).toBeVisible();await page.goForward();await expect(page.locator('.home-find')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await writeFile(info.outputPath('density-metrics.json'),JSON.stringify({width,height,state:'disconnected',sizes},null,2));
  });
  test(`decision facts are readable without expansion and survive comparison at ${width}px`,async({page,context},info)=>{
    test.skip(info.project.name!=='desktop','Run each explicit viewport once.');
    test.setTimeout(90000);
    await page.setViewportSize({width,height});await login(page);const state=await mock(page);await page.goto(privateBase);
    await expect(page.locator('[data-home-state="available"]')).toBeVisible();
    await expect(page.getByRole('searchbox',{name:'店名・エリアから探す'})).toHaveCSS('font-size','16px');
    await expect(page.getByRole('button',{name:'個室',exact:true})).toHaveCount(0);
    await expect(page.locator('.home-catalog-card .catalog-decision-facts')).toHaveCount(3);
    const homeType=await typography(page.locator('.home-search-heading h1,.home-search-description,.home-search-form label,.home-search-form input,.home-search-form button'));
    await capture(page,info,`redesign-home-${width}`);
    await page.getByRole('link',{name:'全10店を見る',exact:true}).click();
    const first=page.locator(`[data-pilot-id="${catalog[0].id}"]`);
    await expect(page.locator('.verified-list img,.catalog-decision details')).toHaveCount(0);
    const price=catalog[0].facts.find(f=>f.field==='price')!.value, room=catalog[0].facts.find(f=>f.field==='private_room')!.value;
    await expect(first.getByText(price,{exact:true})).toBeVisible();await expect(first.getByText(room,{exact:true})).toBeVisible();
    await expect(first.locator('.catalog-decision-facts dt')).toHaveText(['掲載コース・料金','個室']);
    const listType=await typography(first.locator('h2,.catalog-row-identity>p,.catalog-decision-facts dt,.catalog-decision-facts dd'));
    for(const value of await typography(page.locator('.catalog-decision-facts dd')))expect(value.fontSize).toBeGreaterThanOrEqual(16);
    for(const row of catalog){const card=page.locator(`[data-pilot-id="${row.id}"]`);for(const field of ['price','private_room'])await expect(card.locator(`[data-fact="${field}"] dd`)).toHaveText(row.facts.find(f=>f.field===field)?.value??'未確認');if(row.facts.some(f=>f.field==='notice'))await expect(card.locator('.operating-notice')).toContainText(row.facts.find(f=>f.field==='notice')!.value);}
    await capture(page,info,`redesign-list-${width}`);
    await first.getByRole('button',{name:'店舗の詳細を見る',exact:true}).click();
    await expect(page.getByRole('heading',{level:1})).toHaveText(catalog[0].name);
    await expect(page.locator('.detail-decision').getByText(price,{exact:true})).toBeVisible();await expect(page.locator('.detail-decision').getByText(room,{exact:true})).toBeVisible();
    const detailType=await typography(page.locator('.detail-identity h1,.detail-address,.detail-decision dt,.detail-decision dd,.detail-official'));
    for(const value of await typography(page.locator('.detail-decision dd')))expect(value.fontSize).toBeGreaterThanOrEqual(16);
    const titleTop=await page.getByRole('heading',{level:1}).evaluate(el=>el.getBoundingClientRect().top);expect(titleTop).toBeLessThanOrEqual(width===390?260:300);
    await capture(page,info,`redesign-detail-${width}`);
    await page.locator('.pilot-detail').getByRole('button',{name:'比較に追加',exact:true}).click();await page.getByRole('button',{name:'実店舗一覧へ戻る',exact:true}).click();await expect(first).toBeFocused();
    await expect(first.getByRole('button',{name:'比較から外す',exact:true})).toHaveAttribute('aria-pressed','true');
    await page.locator(`[data-pilot-id="${catalog[1].id}"]`).getByRole('button',{name:'比較に追加',exact:true}).click();
    await page.getByRole('button',{name:'候補を比較（2）',exact:true}).click();
    await expect(page.getByRole('table')).toBeVisible();await expect(page.getByRole('table').getByText(price,{exact:true})).toBeVisible();
    const compareType=await typography(page.locator('.comparison-by-condition td>p'));for(const value of compareType)expect(value.fontSize).toBeGreaterThanOrEqual(16);
    await capture(page,info,`redesign-compare-${width}`);
    const comparisonUrl=page.url();await page.getByRole('button',{name:'詳細を見る',exact:true}).first().click();await page.getByRole('button',{name:'比較に戻る',exact:true}).click();await expect(page.getByRole('table')).toBeVisible();await expect(page).toHaveURL(comparisonUrl);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(state.calls.some(call=>/submit|prepare_profile|delete|withdraw/.test(call.name))).toBe(false);
    let before:unknown=null;
    if(process.env.UX_BASELINE_URL){
      const baseline=await context.newPage();await baseline.setViewportSize({width,height});await login(baseline);await mock(baseline);
      await baseline.goto(process.env.UX_BASELINE_URL);await expect(baseline.locator('[data-home-restaurant]')).toHaveCount(3);await capture(baseline,info,`before-home-${width}`);
      await baseline.goto(`${process.env.UX_BASELINE_URL}/#/nagoya`);const prior=baseline.locator(`[data-pilot-id="${catalog[0].id}"]`);await expect(prior).toBeVisible();
      before=await typography(prior.locator('h2,.catalog-room-summary,.catalog-conditions dd'));
      await capture(baseline,info,`before-list-${width}`);await prior.getByRole('button',{name:'店舗の詳細を見る',exact:true}).click();await expect(baseline.locator('.pilot-detail')).toBeVisible();await capture(baseline,info,`before-detail-${width}`);await baseline.close();
    }
    await writeFile(info.outputPath('density-metrics.json'),JSON.stringify({width,height,fixture:'same ten-store mocked catalog; no live backend',homeType,listType,detailType,compareType,titleTop,before},null,2));
  });
}
test('customer detail clears private facts on expired access and failed reload, then recovers without writes',async({page})=>{
  await login(page);await mock(page);await page.goto(`${privateBase}/#/nagoya/${catalog[0].id}`);
  await expect(page.getByRole('heading',{level:1})).toHaveText(catalog[0].name);
  const expired=await mock(page,{expired:true});
  await page.locator('.detail-refresh').getByRole('button',{name:'再読み込み',exact:true}).click();
  await expect(page.getByText('店舗一覧の閲覧期間が終了しました。運営側で利用期間を確認しています。',{exact:true})).toBeVisible();
  await expect(page.locator('.pilot-detail')).toHaveCount(0);
  await expect(page.getByRole('heading',{level:1})).toHaveText('名古屋の会食店を探す');
  expect(expired.calls.some(call=>call.name==='dining_owner_trial_catalog')).toBe(false);
  await mock(page);await page.getByRole('button',{name:'再読み込み',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText(catalog[0].name);
  const denied=await mock(page,{denied:true});
  await page.locator('.detail-refresh').getByRole('button',{name:'再読み込み',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('読み込めませんでした');
  await expect(page.locator('.pilot-detail')).toHaveCount(0);
  await expect(page.getByRole('heading',{level:1})).toHaveText('名古屋の会食店を探す');
  const recovered=await mock(page);await page.getByRole('button',{name:'再読み込み',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText(catalog[0].name);
  expect([...expired.calls,...denied.calls,...recovered.calls].some(call=>/submit|prepare_profile|delete|withdraw/.test(call.name))).toBe(false);
});

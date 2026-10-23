import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Plus, Search, X } from 'lucide-react';
import CatalogSummary from '../components/CatalogSummary';
import { VerifiedEvidence } from '../components/VerifiedFacts';
import { FACT_LABELS, factValue, safeExternalUrl, type FactField } from '../domain/dining';
import { serviceDemoCatalog, serviceDemoDate, serviceDemoGenres, serviceDemoIds, serviceDemoStatus, searchServiceDemo, type ServiceDemoRestaurant } from '../data/serviceDemoCatalog';
import { routeHash, type parseRoute } from '../lib/routing';
import type { SearchParams } from '../lib/search';
import type { Page } from '../types';
import '../styles/service-demo.css';

interface Props {
  route: ReturnType<typeof parseRoute>;
  onNavigate: (page: Page, id?: string, params?: SearchParams) => void;
}
type Navigate = Props['onNavigate'];

function DemoNotice() {
  return <aside className="service-demo-mode" aria-label="デモの利用範囲"><div className="page-width">
    <strong>閲覧専用デモ</strong><span>予約・投稿はできません</span>
  </div></aside>;
}

function DemoSearch({ params, onNavigate }: { params: SearchParams; onNavigate: Navigate }) {
  const [query, setQuery] = useState(params.query ?? '');
  const [genre, setGenre] = useState(params.genre ?? '');
  const [priceOnly, setPriceOnly] = useState(params.information === 'price');
  return <form className="service-demo-search" role="search" aria-label="デモの店舗を絞り込む" onSubmit={event => {
    event.preventDefault();
    onNavigate('service-demo', undefined, { ...params, query: query.trim() || undefined, genre: genre || undefined, information: priceOnly ? 'price' : undefined, returnTo: undefined });
  }}>
    <label className="service-demo-query">店名・エリア・条件から探す<span><Search size={20} aria-hidden="true" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="例：名駅、個室、2〜6名" maxLength={200} /></span></label>
    <button type="submit" className="service-demo-button service-demo-primary">絞り込む<Search size={18} aria-hidden="true" /></button>
    <details className="service-demo-filters" open={!!(params.genre || params.information)}><summary>料理・料金の記録で絞り込む{(params.genre || params.information) && '（適用中）'}</summary><div>
      <label className="service-demo-genre">料理<select value={genre} onChange={event => setGenre(event.target.value)}><option value="">すべての料理</option>{serviceDemoGenres.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="service-demo-price-filter"><input type="checkbox" checked={priceOnly} onChange={event => setPriceOnly(event.target.checked)} />料金の記録がある店舗のみ</label>
      <button type="submit" className="service-demo-button">条件を適用</button>
    </div></details>
  </form>;
}

function SelectionButton({ row, ids, onToggle }: { row: ServiceDemoRestaurant; ids: string[]; onToggle: (id: string) => void }) {
  const selected = ids.includes(row.id);
  return <button type="button" className="service-demo-button" aria-pressed={selected} disabled={!selected && ids.length === 3} onClick={() => onToggle(row.id)}>
    {selected ? <Check size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{selected ? '比較から外す' : '比較に追加'}
  </button>;
}

function SelectionTray({ ids, params, onNavigate, onToggle, isComparison = false }: { ids: string[]; params: SearchParams; onNavigate: Navigate; onToggle: (id: string) => void; isComparison?: boolean }) {
  const rows = ids.map(id => serviceDemoCatalog.find(row => row.id === id)!);
  return <section className="service-demo-selection" aria-label="比較する候補">
    <div className="service-demo-selection-top"><div><strong>比較候補 <span>{ids.length} / 3店</span></strong><p id="service-demo-comparison-help">{ids.length === 1 ? 'あと1店選ぶと比較できます。' : '最大3店まで選べます。'}</p></div>
      {!isComparison && <button type="button" className="service-demo-button service-demo-primary" disabled={ids.length < 2} onClick={() => onNavigate('service-demo-compare', undefined, { ...params, returnTo: undefined })}>選んだ{ids.length}店を比較<ArrowRight size={18} aria-hidden="true" /></button>}
    </div>
    {rows.length > 0 && <details className="service-demo-selection-options" open={isComparison}><summary>選んだ店舗を確認・外す</summary><ul>{rows.map(row => <li key={row.id}><span>{row.name}</span><button type="button" onClick={() => onToggle(row.id)} aria-label={`${row.name}を比較から外す`}><X size={18} aria-hidden="true" /></button></li>)}</ul></details>}
  </section>;
}

function DemoList({ params, ids, onNavigate, onToggle }: { params: SearchParams; ids: string[]; onNavigate: Navigate; onToggle: (id: string) => void }) {
  const rows = searchServiceDemo(params);
  const filtered = !!(params.query || params.genre || params.information);
  return <>
    <header className="service-demo-heading"><h1>店舗選びを試す</h1></header>
    <p className="service-demo-explanation">公式情報を確認した記録の固定表示です。最新の営業状況・空席ではありません。</p>
    <DemoSearch key={`${params.query ?? ''}:${params.genre ?? ''}:${params.information ?? ''}`} params={params} onNavigate={onNavigate} />
    {ids.length > 0 && <SelectionTray ids={ids} params={params} onNavigate={onNavigate} onToggle={onToggle} />}
    <div className="service-demo-result-heading"><p role="status">表示中 <strong>{rows.length}店</strong><span> / 記録 {serviceDemoCatalog.length}店</span></p>{filtered && <button type="button" className="service-demo-text-button" onClick={() => onNavigate('service-demo', undefined, { ids: params.ids })}>絞り込みを解除</button>}</div>
    <div className="service-demo-list">{rows.map(row => <article key={row.id} id={`verified-${row.id}`} tabIndex={-1} className="service-demo-card" data-demo-id={row.id} aria-labelledby={`demo-title-${row.id}`}>
      <div className="service-demo-identity"><p>{factValue(row, 'genre') ?? '料理は未確認'}</p><h2 id={`demo-title-${row.id}`}><a href={routeHash('service-demo-detail', row.id, { ...params, returnTo: undefined })} onClick={event => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onNavigate('service-demo-detail', row.id, { ...params, returnTo: undefined }); } }}>{row.name}</a></h2><p>{row.address}</p></div>
      <CatalogSummary restaurant={row} />
      <div className="service-demo-card-actions"><button type="button" className="service-demo-button service-demo-primary" onClick={() => onNavigate('service-demo-detail', row.id, { ...params, returnTo: undefined })}>店舗の詳細を見る<ArrowRight size={17} aria-hidden="true" /></button><SelectionButton row={row} ids={ids} onToggle={onToggle} /></div>
      <div className="service-demo-record-meta"><span>記録の確認日：{serviceDemoDate(row.factsCheckedAt)}</span><span>{serviceDemoStatus(row)}</span><VerifiedEvidence restaurant={row} /></div>
    </article>)}</div>
    {rows.length === 0 && <section className="service-demo-empty"><h2>条件に合う記録がありません</h2><p>店名やエリアを短くするか、絞り込みを解除してください。選んだ比較候補はそのまま残ります。</p><button type="button" className="service-demo-button" onClick={() => onNavigate('service-demo', undefined, { ids: params.ids })}>すべての記録を見る</button></section>}
    <p className="service-demo-bottom-note">料金の基準・税・サービス料・室料は店舗ごとに異なります。価格順の順位づけや、個室の防音性の評価はしていません。予約・投稿・ログインはできません。</p>
  </>;
}

function DetailNavigation({ params, onNavigate }: { params: SearchParams; onNavigate: Navigate }) {
  return <nav className="service-demo-back" aria-label="店舗情報の移動"><button type="button" onClick={() => onNavigate('service-demo', undefined, { ...params, returnTo: undefined })}><ArrowLeft size={17} aria-hidden="true" />デモの店舗一覧へ</button>{params.returnTo === 'service-demo-compare' && <button type="button" onClick={() => onNavigate('service-demo-compare', undefined, { ...params, returnTo: undefined })}>比較に戻る<ArrowRight size={17} aria-hidden="true" /></button>}</nav>;
}

function DemoDetail({ id, params, ids, onNavigate, onToggle }: { id?: string; params: SearchParams; ids: string[]; onNavigate: Navigate; onToggle: (id: string) => void }) {
  const row = serviceDemoCatalog.find(row => row.id === id);
  if (!row) return <><DetailNavigation params={params} onNavigate={onNavigate} /><section className="service-demo-empty"><h1>この店舗の記録はありません</h1><p>閲覧専用デモの一覧から店舗を選んでください。</p></section></>;
  const website = safeExternalUrl(factValue(row, 'website') ?? '');
  return <article className="service-demo-detail" aria-labelledby="service-demo-detail-title">
    <DetailNavigation params={params} onNavigate={onNavigate} />
    <header className="service-demo-heading"><p className="service-demo-kicker">{factValue(row, 'genre') ?? '料理は未確認'}</p><h1 id="service-demo-detail-title">{row.name}</h1><p>{row.address}</p></header>
    <div className="service-demo-detail-layout"><div className="service-demo-detail-main"><CatalogSummary restaurant={row} />
      <div className="service-demo-detail-actions"><SelectionButton row={row} ids={ids} onToggle={onToggle} />{website && <a className="service-demo-button service-demo-primary" href={website} target="_blank" rel="noreferrer">公式サイトで最新情報を確認<ArrowUpRight size={18} aria-hidden="true" /></a>}</div>
      <p className="service-demo-explanation">料金と利用条件は記録時点の情報です。空席や現在の営業は未確認です。このデモでは予約・投稿はできません。</p>
      <section className="service-demo-detail-basic" aria-labelledby="service-demo-basic-title"><h2 id="service-demo-basic-title">そのほかの確認項目</h2><dl>{(['hours', 'access'] as FactField[]).map(field => <div key={field}><dt>{FACT_LABELS[field]}</dt><dd>{factValue(row, field) ?? 'この記録では未確認'}</dd></div>)}<div><dt>空席・防音性</dt><dd>この記録では未確認</dd></div></dl></section>
    </div><aside className="service-demo-provenance" aria-label="この店舗の記録について"><h2>この記録について</h2><dl><div><dt>確認日</dt><dd>{serviceDemoDate(row.factsCheckedAt)}</dd></div><div><dt>記録の状態</dt><dd>{serviceDemoStatus(row)}</dd></div></dl><p>公式情報を確認した記録の固定表示です。最新情報や来店体験を示すものではありません。</p><VerifiedEvidence restaurant={row} /><p>口コミ・評価・店舗写真は、このデモに掲載していません。</p></aside></div>
    {ids.length > 0 && <SelectionTray ids={ids} params={params} onNavigate={onNavigate} onToggle={onToggle} />}
    <DetailNavigation params={params} onNavigate={onNavigate} />
  </article>;
}

const comparisonFields: FactField[] = ['price', 'private_room', 'notice', 'genre', 'address', 'hours', 'access'];
function DemoComparison({ ids, params, onNavigate, onToggle }: { ids: string[]; params: SearchParams; onNavigate: Navigate; onToggle: (id: string) => void }) {
  const rows = ids.map(id => serviceDemoCatalog.find(row => row.id === id)!);
  return <div className="service-demo-compare-page">
    <DetailNavigation params={{ ...params, returnTo: undefined }} onNavigate={onNavigate} />
    <header className="service-demo-heading"><h1>候補を比較</h1></header>
    {rows.length < 2 ? <section className="service-demo-empty"><h2>比較する店舗を2〜3店選んでください</h2><p>一覧の「比較に追加」から候補を選べます。選択した店舗は、このページのURLに保持されます。</p><button type="button" className="service-demo-button service-demo-primary" onClick={() => onNavigate('service-demo', undefined, { ...params, returnTo: undefined })}>デモの店舗一覧で選ぶ<ArrowRight size={18} aria-hidden="true" /></button></section> :
      <table className="service-demo-comparison" role="table"><caption>記録時点の情報です。料金は同じ基準の総額ではありません。</caption><thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">確認する条件</th>{rows.map(row => <th scope="col" role="columnheader" id={`demo-compare-${row.id}`} key={row.id}><h2>{row.name}</h2></th>)}</tr></thead><tbody role="rowgroup">
        {comparisonFields.map(field => <tr role="row" key={field} data-compare-field={field}><th scope="row" role="rowheader" id={`demo-compare-field-${field}`}>{FACT_LABELS[field]}</th>{rows.map(row => <td role="cell" headers={`demo-compare-field-${field} demo-compare-${row.id}`} key={row.id}><span className="service-demo-cell-name" aria-hidden="true">{row.name}</span><p>{factValue(row, field) ?? 'この記録では未確認'}</p></td>)}</tr>)}
        <tr role="row"><th scope="row" role="rowheader" id="demo-compare-source">記録・出典</th>{rows.map(row => <td role="cell" headers={`demo-compare-source demo-compare-${row.id}`} key={row.id}><span className="service-demo-cell-name" aria-hidden="true">{row.name}</span><p>確認日：{serviceDemoDate(row.factsCheckedAt)}</p><p>{serviceDemoStatus(row)}</p><VerifiedEvidence restaurant={row} /><button type="button" className="service-demo-text-button" onClick={() => onNavigate('service-demo-detail', row.id, { ...params, returnTo: 'service-demo-compare' })}>詳細を見る<ArrowRight size={16} aria-hidden="true" /></button></td>)}</tr>
      </tbody></table>}
    <SelectionTray ids={ids} params={params} onNavigate={onNavigate} onToggle={onToggle} isComparison />
    <p className="service-demo-bottom-note">空席や個室の防音性は未確認です。公式サイトへのリンクは外部サイトを開きます。このデモから予約情報や個人情報を送信することはありません。</p>
    <DetailNavigation params={{ ...params, returnTo: undefined }} onNavigate={onNavigate} />
  </div>;
}

/** Read-only and standalone: filtering and comparison change only the URL. */
export default function ServiceDemo({ route, onNavigate }: Props) {
  const ids = serviceDemoIds(route.params.ids);
  const onToggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter(value => value !== id) : ids.length < 3 ? [...ids, id] : ids;
    onNavigate(route.page, route.restaurantId, { ...route.params, ids: next.length ? next.join(',') : undefined });
  };
  return <div className="service-demo"><DemoNotice /><div className="page-width service-demo-content">
    {route.page === 'service-demo-detail' ? <DemoDetail id={route.restaurantId} params={route.params} ids={ids} onNavigate={onNavigate} onToggle={onToggle} /> : route.page === 'service-demo-compare' ? <DemoComparison ids={ids} params={route.params} onNavigate={onNavigate} onToggle={onToggle} /> : <DemoList params={route.params} ids={ids} onNavigate={onNavigate} onToggle={onToggle} />}
  </div></div>;
}

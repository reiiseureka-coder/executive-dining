import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAppAccess } from '../contexts/appAccess';
import { useAuth } from '../contexts/auth';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { ownerTrialRepository } from '../data/ownerTrialClient';
import { factValue, type PublishedFact } from '../domain/dining';
import { diningImagery } from '../lib/catalogImagery';
import { routeHash } from '../lib/routing';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { CatalogPhoto } from './CatalogPresentation';
type Row = { id: string; name: string; address: string; facts: PublishedFact[] };
type Props = { onNavigate: (page: Page, id?: string, params?: SearchParams) => void };
function Showcase({ rows, privateMode = false, onNavigate }: Props & { rows: Row[]; privateMode?: boolean }) {
  // A neutral alphabetical sample, not a ranking or recommendation.
  const sample = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ja')).slice(0, 3);
  return <section className="page-width section-space home-catalog" aria-labelledby="home-catalog-title">
    <div className="section-heading"><div><p className="eyebrow">{sample.length ? 'NAGOYA' : 'DINING'}</p><h2 id="home-catalog-title">{sample.length ? '名古屋の店舗' : '会食のイメージから'}</h2></div><a className="text-link" href="#/nagoya" onClick={e => { e.preventDefault(); onNavigate('nagoya'); }}>すべてのお店へ<ArrowRight size={16} /></a></div>
    <p className="home-catalog-note">{sample.length ? `${privateMode ? '招待アカウント向けの非公開情報です。' : ''}店名順で一部をご紹介しています。写真はすべて生成イメージです。` : '写真は生成イメージです。実際のお店の内装・料理を示すものではありません。'}</p>
    <div className="home-catalog-grid">{sample.length ? sample.map(row => <article className="home-catalog-card" key={row.id} data-home-restaurant={row.id}>
      <a className="home-catalog-photo-link" href={routeHash('nagoya-detail', row.id)} aria-label={`${row.name}の詳細を見る`} onClick={e => { e.preventDefault(); onNavigate('nagoya-detail', row.id); }}><CatalogPhoto restaurant={row} showWebsite={false} /></a>
      <p className="eyebrow">{factValue(row, 'genre') ?? '名古屋'}</p><h3><a href={routeHash('nagoya-detail', row.id)} onClick={e => { e.preventDefault(); onNavigate('nagoya-detail', row.id); }}>{row.name}<ArrowRight size={16} /></a></h3><p>{row.address}</p>
    </article>) : ([['japanese', '和食を囲む一席', '日本料理'], ['chinese', '中国料理を楽しむ', '中国料理'], ['room', 'お店の条件を確かめる', '']] as const).map(([key, title, query]) => <article className="home-catalog-card home-inspiration-card" key={key}>
      <a href={routeHash('nagoya', undefined, { query })} onClick={e => { e.preventDefault(); onNavigate('nagoya', undefined, { query }); }}><figure className="catalog-photo"><div className="catalog-photo-frame"><img src={diningImagery[key].src} alt={diningImagery[key].alt} width="1200" height="800" loading="lazy" /><span className="catalog-image-label">イメージ</span></div><figcaption>生成イメージ · 実際の店舗・料理ではありません</figcaption></figure><h3>{title}<ArrowRight size={16} /></h3><p>名古屋のお店を探す</p></a>
    </article>)}</div>
  </section>;
}
function PublicShowcase(props: Props) {
  const { rows } = usePublicCatalog();
  return <Showcase {...props} rows={rows} />;
}
function PrivateShowcase(props: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    const controller = new AbortController(); let timer: number | undefined;
    void (async () => {
      if (!ownerTrialRepository) return;
      const context = await ownerTrialRepository.context(controller.signal);
      if (!context.active || Date.parse(context.endsAt) <= Date.now()) return;
      const catalog = await ownerTrialRepository.catalog(controller.signal);
      if (controller.signal.aborted || Date.parse(context.endsAt) <= Date.now()) return;
      setRows(catalog);
      timer = window.setTimeout(() => setRows([]), Math.max(0, Date.parse(context.endsAt) - Date.now()));
    })().catch(() => { /* Never substitute cached private data after denial or failure. */ });
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, []);
  return <Showcase {...props} rows={rows} privateMode />;
}
export default function HomeCatalog(props: Props) {
  const access = useAppAccess(); const { user } = useAuth();
  return access.ownerTrial && user ? <PrivateShowcase key={user.id} {...props} /> : <PublicShowcase {...props} />;
}

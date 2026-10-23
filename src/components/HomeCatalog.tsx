import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAppAccess } from '../contexts/appAccess';
import { useAuth } from '../contexts/auth';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { ownerTrialRepository } from '../data/ownerTrialClient';
import { factValue, type PublishedFact } from '../domain/dining';
import { routeHash } from '../lib/routing';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
type Row = { id: string; name: string; address: string; facts: PublishedFact[] };
type Props = { onNavigate: (page: Page, id?: string, params?: SearchParams) => void };
function Showcase({ rows, privateMode = false, onNavigate }: Props & { rows: Row[]; privateMode?: boolean }) {
  // A neutral alphabetical sample, not a ranking or recommendation.
  const sample = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ja')).slice(0, 3);
  return <section className="page-width home-catalog" aria-labelledby="home-catalog-title">
    <div className="section-heading"><div><h2 id="home-catalog-title">{sample.length ? '名古屋の店舗から' : '掲載情報について'}</h2></div><a className="text-link" href="#/nagoya" onClick={e => { e.preventDefault(); onNavigate('nagoya'); }}>{sample.length ? 'すべてのお店へ' : '掲載状況を確認する'}<ArrowRight size={16} aria-hidden="true" /></a></div>
    {sample.length > 0 ? <>
      <p className="home-catalog-note">{privateMode ? '招待アカウント向けの非公開情報です。' : ''}店名順で一部をご紹介しています。推薦・ランキングではありません。</p>
      <div className="home-discovery-list">{sample.map(row => <article className="home-catalog-card" key={row.id} data-home-restaurant={row.id}>
        <div><p className="eyebrow">{factValue(row, 'genre') ?? '名古屋'}</p><h3><a href={routeHash('nagoya-detail', row.id)} onClick={e => { e.preventDefault(); onNavigate('nagoya-detail', row.id); }}>{row.name}<ArrowRight size={20} aria-hidden="true" /></a></h3><p>{row.address}</p></div>
      </article>)}</div>
    </> : <p className="home-catalog-preparing">一般公開に向け、店舗の公式情報を確認しています。確認が済んだ情報から順次掲載します。</p>}
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

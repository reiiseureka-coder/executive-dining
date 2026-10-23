import { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useAppAccess } from '../contexts/appAccess';
import { useAuth } from '../contexts/auth';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { diningRepository } from '../data/diningClient';
import { ownerTrialRepository } from '../data/ownerTrialClient';
import { ReviewGatewayError } from '../data/repositories/proposedReviewRepository';
import { factValue, type PublishedFact, type PublishedReview } from '../domain/dining';
import { openLoginDialog } from '../lib/loginDialog';
import { supabase, emailSignInEnabled, googleSignInEnabled } from '../lib/supabase';
import { routeHash } from '../lib/routing';
import CatalogSummary from './CatalogSummary';
import { VerifiedReviews } from './VerifiedFacts';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';

type Row = { id: string; name: string; address: string; facts: PublishedFact[]; reviews?: PublishedReview[] };
type Props = { onNavigate: (page: Page, id?: string, params?: SearchParams) => void };
type UnavailableState = 'disconnected' | 'loading' | 'error' | 'preparing' | 'private-empty' | 'inactive' | 'expired' | 'denied';
type PrivateSnapshot = { state: UnavailableState | 'available'; rows: Row[] };

function HomeHeading({ preparing = false, available = false }: { preparing?: boolean; available?: boolean }) {
  return <header className="home-search-heading">
    <h1 id="home-title">{preparing ? '名古屋の会食店、公開準備中' : '名古屋の会食店を探す'}</h1>
    {available && <p className="home-search-description">会食の口コミとお店の情報から、候補を探せます。</p>}
  </header>;
}

function Unavailable({ state, reload, showLogin = false, accessLoading = false }: {
  state: UnavailableState; reload?: () => void; showLogin?: boolean; accessLoading?: boolean;
}) {
  const messages: Record<UnavailableState, { title: string; description: string }> = {
    disconnected: { title: '店舗情報は未接続です', description: 'この環境では店舗情報への接続が設定されていないため、検索はまだ利用できません。公開済みの店舗があるかも確認できていません。' },
    loading: { title: accessLoading ? '閲覧できる情報を確認しています' : '店舗情報を読み込んでいます', description: '確認が終わると、検索と店舗の一覧を表示します。' },
    error: { title: '店舗情報を読み込めませんでした', description: '情報を確認できないため、店舗を表示していません。時間をおいて再読み込みしてください。' },
    preparing: { title: '公開中の店舗情報はまだありません', description: '一般公開に向け、店舗の公式情報を確認しています。公開された情報から検索できるようになります。' },
    'private-empty': { title: '閲覧できる店舗情報はまだありません', description: '招待アカウントの閲覧は有効ですが、現在表示できる非公開の店舗情報はありません。' },
    inactive: { title: '招待アカウントの閲覧は現在無効です', description: '非公開の店舗情報は表示していません。閲覧を再開できるかは、招待元へご確認ください。' },
    expired: { title: '招待アカウントの閲覧期間が終了しました', description: '期限を過ぎたため、非公開の店舗情報は表示していません。' },
    denied: { title: 'このアカウントの閲覧権限を確認できませんでした', description: '非公開の店舗情報は表示していません。招待を受けたアカウントでログインしているかをご確認ください。' },
  };
  const message = messages[state];
  return <section className="page-width home-find" data-home-state={state} aria-labelledby="home-title">
    <HomeHeading preparing={state === 'preparing'} />
    <div className="home-catalog-state" role={state === 'error' || state === 'denied' ? 'alert' : 'status'}>
      <h2 className="home-state-title">{message.title}</h2>
      <p className={`home-state-description${state === 'preparing' ? ' home-catalog-preparing' : ''}`}>{message.description}</p>
      {(reload || showLogin) && <div className="home-state-actions">
        {reload && <button className="button-secondary" onClick={reload}>再読み込み</button>}
        {showLogin && <button className="primary-button" onClick={openLoginDialog}>招待済みの方はログイン</button>}
      </div>}
    </div>
  </section>;
}

function Showcase({ rows, privateMode = false, onNavigate }: Props & { rows: Row[]; privateMode?: boolean }) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const genres = [...new Set(rows.map(row => factValue(row, 'genre')).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'ja'));
  // A neutral alphabetical sample, not a ranking or recommendation.
  const sample = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ja')).slice(0, 3);
  return <section className="page-width home-find" data-home-state="available" aria-labelledby="home-title">
    <HomeHeading available />
    {privateMode && <p className="home-access-note">招待アカウント向けの非公開情報を表示しています。</p>}
    <form className="home-search-form" role="search" onSubmit={event => {
      event.preventDefault();
      onNavigate('nagoya', undefined, { query: query.trim(), genre: genre || undefined });
    }}>
      <div className="home-search-field">
        <label htmlFor="home-query">店名・エリアから探す</label>
        <div className="home-search-controls"><Search size={19} aria-hidden="true" /><input id="home-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="例：店名、名駅、栄" type="search" /></div>
      </div>
      {genres.length > 0 && <label className="home-genre-field" htmlFor="home-genre">料理<select id="home-genre" value={genre} onChange={event => setGenre(event.target.value)}><option value="">すべての料理</option>{genres.map(value => <option key={value}>{value}</option>)}</select></label>}
      <button className="primary-button" type="submit">一覧で探す<ArrowRight size={18} aria-hidden="true" /></button>
    </form>
    <section className="home-catalog" aria-labelledby="home-catalog-title">
      <div className="section-heading"><h2 id="home-catalog-title">{privateMode ? '閲覧できる店舗' : '掲載中の店舗'}</h2><a className="text-link" href="#/nagoya" onClick={event => { event.preventDefault(); onNavigate('nagoya'); }}>全{rows.length}店を見る<ArrowRight size={16} aria-hidden="true" /></a></div>
      <p className="home-catalog-note">店名順の{sample.length}店を表示・おすすめ順ではありません</p>
      <div className="home-discovery-list">{sample.map(row => <article className="home-catalog-card" key={row.id} data-home-restaurant={row.id}>
        <div className="home-catalog-identity">
          <h3><a href={routeHash('nagoya-detail', row.id)} onClick={event => { event.preventDefault(); onNavigate('nagoya-detail', row.id); }}>{row.name}</a></h3>
          <p className="home-catalog-meta">{factValue(row, 'genre') ?? '料理ジャンルは未確認'}</p>
          <p className="home-catalog-meta">{row.address}</p>
        </div>
        <div className="home-catalog-reading">
          {row.reviews ? <VerifiedReviews restaurant={{ id: row.id, reviews: row.reviews }} compact /> : <section className="home-private-reviews"><h4>会食の口コミ</h4><p>この非公開一覧には、公開口コミを表示していません。</p></section>}
          <CatalogSummary restaurant={row} />
        </div>
        <div className="home-catalog-actions"><button className="button-secondary" onClick={() => onNavigate('nagoya-detail', row.id)}>詳細を見る<ArrowRight size={16} aria-hidden="true" /></button></div>
      </article>)}</div>
    </section>
  </section>;
}

function PublicShowcase(props: Props) {
  const { user } = useAuth();
  const { rows, loading, error, reload } = usePublicCatalog();
  const loginAvailable = Boolean(supabase && (emailSignInEnabled || googleSignInEnabled));
  // Missing deployment configuration is not the same as a connected, empty catalog.
  if (!diningRepository) return <Unavailable state="disconnected" />;
  if (loading) return <Unavailable state="loading" />;
  if (error) return <Unavailable state="error" reload={() => void reload()} showLogin={!user && loginAvailable} />;
  if (!rows.length) return <Unavailable state="preparing" showLogin={!user && loginAvailable} />;
  return <Showcase {...props} rows={rows} />;
}

function PrivateShowcase(props: Props) {
  const [snapshot, setSnapshot] = useState<PrivateSnapshot>({ state: ownerTrialRepository ? 'loading' : 'disconnected', rows: [] });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;
    void (async () => {
      if (!ownerTrialRepository) return;
      const context = await ownerTrialRepository.context(controller.signal);
      if (controller.signal.aborted) return;
      if (Date.parse(context.endsAt) <= Date.now()) {
        setSnapshot({ state: 'expired', rows: [] });
        return;
      }
      if (!context.active) {
        setSnapshot({ state: 'inactive', rows: [] });
        return;
      }
      const catalog = await ownerTrialRepository.catalog(controller.signal);
      if (controller.signal.aborted) return;
      if (Date.parse(context.endsAt) <= Date.now()) {
        setSnapshot({ state: 'expired', rows: [] });
        return;
      }
      setSnapshot({ state: catalog.length ? 'available' : 'private-empty', rows: catalog });
      timer = window.setTimeout(() => setSnapshot({ state: 'expired', rows: [] }), Math.max(0, Date.parse(context.endsAt) - Date.now()));
    })().catch(reason => {
      // Never retain or substitute private data after a denial or failed read.
      if (!controller.signal.aborted) setSnapshot({ state: reason instanceof ReviewGatewayError && reason.code === 'denied' ? 'denied' : 'error', rows: [] });
    });
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [revision]);
  const reload = () => {
    setSnapshot({ state: 'loading', rows: [] });
    setRevision(value => value + 1);
  };
  return snapshot.state === 'available'
    ? <Showcase {...props} rows={snapshot.rows} privateMode />
    : <Unavailable state={snapshot.state} reload={snapshot.state === 'error' ? reload : undefined} />;
}

export default function HomeCatalog(props: Props) {
  const access = useAppAccess();
  const { user, loading } = useAuth();
  if (loading || access.loading) return <Unavailable state="loading" accessLoading />;
  // Match App's route gate: never offer destinations that permission recovery would block.
  if (user && access.unavailable) return <Unavailable state="denied" reload={access.retry} />;
  return access.ownerTrial && user ? <PrivateShowcase key={user.id} {...props} /> : <PublicShowcase {...props} />;
}

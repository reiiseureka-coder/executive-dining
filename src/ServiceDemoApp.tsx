import { StrictMode, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import type { Page } from './types';
import type { SearchParams } from './lib/search';
import { parseRoute, routeHash } from './lib/routing';
import { pagePosition, rememberPagePosition } from './lib/pageScroll';
import ServiceDemo from './pages/ServiceDemo';
import './index.css';
import './styles/editorial-redesign.css';
import './styles/dining-details.css';
import './styles/service-demo-shell.css';

// Separate HTML entry: deliberately no Supabase, auth, access, or live-data imports.
function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  window.addEventListener('popstate', callback);
  return () => { window.removeEventListener('hashchange', callback); window.removeEventListener('popstate', callback); };
}
export default function DemoShell() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '#/preview');
  const parsed = parseRoute(hash);
  const route = parsed.page.startsWith('service-demo') ? parsed : { page: 'service-demo' as const, params: {} };
  useEffect(() => { document.title = `${route.page === 'service-demo-detail' ? '店舗情報' : route.page === 'service-demo-compare' ? '候補を比較' : '店舗を探す'}・閲覧専用デモ | Executive Dining`; }, [route.page]);
  const previousPath = useRef(hash.split('?')[0]);
  useLayoutEffect(() => {
    const path = hash.split('?')[0];
    if (path === previousPath.current) return;
    previousPath.current = path;
    const saved = pagePosition(hash);
    window.scrollTo({ top: saved?.top ?? 0, behavior: 'instant' });
    (saved?.focusId ? document.getElementById(saved.focusId) : document.getElementById('main-content'))?.focus({ preventScroll: true });
  }, [hash]);
  const onNavigate = (page: Page, id?: string, params?: SearchParams) => {
    if (page === 'home') { window.location.assign('/#/'); return; }
    // Static demo navigation cannot dispatch to privileged application routes.
    if (!page.startsWith('service-demo')) return;
    rememberPagePosition(hash, window.scrollY, route.page === 'service-demo' && page === 'service-demo-detail' && id ? `verified-${id}` : undefined);
    window.location.hash = routeHash(page, id, params ?? route.params);
  };
  return <div className="standalone-demo">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>本文へ移動</a>
    <header className="site-header service-demo-header"><div className="page-width header-inner">
      <a href="/#/" className="brand" aria-label="Executive Dining ホーム"><span className="brand-monogram">E<span>D</span></span><span className="wordmark">EXECUTIVE<span>DINING</span></span></a>
      <nav aria-label="デモのナビゲーション"><a href="/#/">ホーム</a><a href="#/preview" aria-current={route.page === 'service-demo' ? 'page' : undefined} onClick={event => { event.preventDefault(); onNavigate('service-demo', undefined, {}); }}>店舗デモ</a></nav>
    </div></header>
    <main id="main-content" tabIndex={-1}><ServiceDemo route={route} onNavigate={onNavigate} /></main>
    <footer className="site-footer"><div className="page-width footer-inner"><span className="wordmark">EXECUTIVE DINING</span><p>閲覧専用デモ · 実際の予約・投稿はできません</p><a href="/#/">サービスのホームへ</a></div></footer>
  </div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><DemoShell /></StrictMode>);

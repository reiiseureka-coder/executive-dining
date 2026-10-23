import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { Page } from "./types";
import type { SearchParams } from "./lib/search";
import { parseRoute, routeHash } from "./lib/routing";
import { pagePosition, rememberPagePosition } from "./lib/pageScroll";
import { isAdminEmailCallback } from "./lib/authLanding";
import { AppAccessProvider } from "./contexts/AppAccessProvider";
import { useAppAccess } from "./contexts/appAccess";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import AdminCallbackLanding from "./components/AdminCallbackLanding";
import DemoHome from "./pages/DemoHome";
import Home from "./pages/Home";
import Find from "./pages/Find";
import PartnerPage from "./pages/PartnerPage";
import Corporate from "./pages/Corporate";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Nagoya from "./pages/Nagoya";
import NagoyaDetail from "./pages/NagoyaDetail";
import Compare from "./pages/Compare";
import Membership from "./pages/Membership";
import OwnerTrial from "./pages/OwnerTrial";
import Curation from "./pages/Curation";
export type { SearchParams } from "./lib/search";
function subscribe(callback: () => void) {
  let restartingForCallback = false;
  const changed = () => {
    // Opening a fresh auth fragment in an already-loaded SPA is a same-document navigation.
    // Reload once so the standard SDK validates it; the SDK detection hook then clears it.
    if (isAdminEmailCallback(window.location.hash)) {
      if (!restartingForCallback) { restartingForCallback = true; window.location.reload(); }
      return;
    }
    callback();
  };
  window.addEventListener("hashchange", changed);
  window.addEventListener("popstate", changed);
  return () => {
    window.removeEventListener("hashchange", changed);
    window.removeEventListener("popstate", changed);
  };
}
function AppShell() {
  const access = useAppAccess();
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "#/",
  );
  const route = parseRoute(hash);
  const previousPath = useRef(hash.split('?')[0]);
  useLayoutEffect(() => {
    const path = hash.split('?')[0];
    if (path === previousPath.current) return;
    previousPath.current = path;
    const position = pagePosition(hash);
    window.scrollTo({top: position?.top ?? 0, behavior: "instant"});
    (position?.focusId ? document.getElementById(position.focusId) : document.getElementById('main-content'))?.focus({preventScroll:true});
  }, [hash]);
  const handleNavigate = (
    page: Page,
    restaurantId?: string,
    params?: SearchParams,
  ) => {
    const search =
      params ??
      (["search", "detail", "nagoya", "nagoya-detail", "home", "compare", "pilot", "pilot-detail"].includes(route.page) ? route.params : {});
    rememberPagePosition(hash, window.scrollY, ["nagoya", "pilot"].includes(route.page) && ["nagoya-detail", "pilot-detail"].includes(page) && restaurantId ? `verified-${restaurantId}` : undefined);
    window.location.hash = routeHash(
      page,
      restaurantId,
      ["search", "detail", "nagoya", "nagoya-detail", "compare", "pilot", "pilot-detail"].includes(page) ? search : {},
    );

  };
  const updateSearch = (params: SearchParams) => {
    window.history.replaceState(
      null,
      "",
      routeHash(route.page === "search" ? "search" : "nagoya", undefined, params),
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  useEffect(() => {
    const labels: Record<Page, string> = {
      home: "会食の候補を、条件で選ぶ",
      find: "名古屋の会食店を探す",
      "service-demo": "閲覧専用デモ",
      "service-demo-detail": "閲覧専用デモ・店舗情報",
      "service-demo-compare": "閲覧専用デモ・比較",
      restaurants: "店舗掲載のご案内",
      corporate: "法人の方へ・福利厚生プラン",
      demo: "サンプル・デモ",
      "nagoya-detail": "名古屋の店舗情報",
      compare: "会食候補を比較",
      membership: "会員登録のデモ",
      pilot: "実店舗の非公開テスト",
      "pilot-detail": "店舗情報の操作確認",
      search: "お店を探す",
      detail: "店舗情報",
      about: "このサービスについて",
      admin: "掲載店登録",
      nagoya: "名古屋の掲載情報",
      curation: "店舗情報の確認・審査",
    };
    document.title = `${labels[route.page]} | Executive Dining`;
  }, [route.page]);
  return (
    <>
      <AdminCallbackLanding />
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        本文へ移動
      </a>
      <Header
        key={hash}
        currentPage={route.page}
        onNavigate={handleNavigate}
      />
      {access.ownerTrial && ["pilot", "pilot-detail", "curation"].includes(route.page) && <div className="private-mode-banner"><div className="page-width">非公開テスト中 · 店舗は実在、プロフィール・投稿は固定の架空データです。<button onClick={() => handleNavigate("nagoya")}>店舗一覧へ</button></div></div>}
      <main id="main-content" tabIndex={-1}>
        {route.page === "home" && <Home onNavigate={handleNavigate} />}
        {route.page === "find" && <Find onNavigate={handleNavigate} />}
        {route.page.startsWith("service-demo") && <div className="page-width catalog-page"><h1>閲覧専用デモ</h1><p>デモは本サービスの認証・データ接続から分離しています。</p><a className="primary-button" href={`/preview.html${hash}`}>閲覧専用デモを開く</a></div>}
        {route.page === "restaurants" && <PartnerPage audience="restaurants" />}
        {route.page === "corporate" && <Corporate />}
        {route.page === "demo" && <DemoHome onNavigate={handleNavigate} />}
        {route.page === "search" && (
          <Search
            params={route.params}
            onChange={updateSearch}
            onNavigate={handleNavigate}
          />
        )}
        {route.page === "detail" && (
          <Detail
            key={route.restaurantId}
            restaurantId={route.restaurantId ?? ""}
            onNavigate={handleNavigate}
          />
        )}
        {["nagoya", "nagoya-detail", "compare", "pilot", "pilot-detail"].includes(route.page) && (access.loading ? <div className="page-width catalog-page" role="status">利用できる店舗情報を確認しています…</div> : access.ownerTrial || ["pilot", "pilot-detail"].includes(route.page) ? <OwnerTrial route={route} onNavigate={handleNavigate} /> : access.unavailable ? <div className="page-width catalog-page"><p role="alert">利用権限を確認できませんでした。接続を確認して、もう一度お試しください。</p><button className="button-secondary" onClick={access.retry}>利用権限を再確認</button></div> : route.page === "nagoya-detail" ? <NagoyaDetail restaurantId={route.restaurantId ?? ""} params={route.params} onNavigate={handleNavigate} /> : route.page === "compare" ? <Compare params={route.params} onNavigate={handleNavigate} /> : <Nagoya params={route.params} onChange={updateSearch} onNavigate={handleNavigate} />)}
        {route.page === "curation" && <Curation />}
        {route.page === "membership" && <Membership />}
        {route.page === "admin" && <Admin />}
        {route.page === "about" && <About onNavigate={handleNavigate} />}
      </main>
      <footer className="site-footer">
        <div className="page-width footer-inner">
          <span className="wordmark">EXECUTIVE DINING</span>
          <p>会食の店選びを、丁寧に。</p>
          <a href="#/">ホーム</a>
          <a href="#/find">店舗を探す</a>
          <a href="#/restaurants">店舗の方へ</a>
          <a href="#/corporate">法人の方へ</a>
          <a href="#/about">掲載情報について</a>
          {access.editor && <a href="#/curation">運営管理</a>}
          <span>© {new Date().getFullYear()} Executive Dining</span>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return <AuthProvider><AppAccessProvider><AppShell /></AppAccessProvider></AuthProvider>;
}

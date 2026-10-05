import { useEffect, useSyncExternalStore } from "react";
import type { Page } from "./types";
import type { SearchParams } from "./lib/search";
import { parseRoute, routeHash } from "./lib/routing";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import Admin from "./pages/Admin";
import About from "./pages/About";
export type { SearchParams } from "./lib/search";
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
export default function App() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "#/",
  );
  const route = parseRoute(hash);
  const handleNavigate = (
    page: Page,
    restaurantId?: string,
    params?: SearchParams,
  ) => {
    const search =
      params ??
      (route.page === "search" || route.page === "detail" ? route.params : {});
    window.location.hash = routeHash(
      page,
      restaurantId,
      page === "search" || page === "detail" ? search : {},
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const updateSearch = (params: SearchParams) => {
    window.history.replaceState(
      null,
      "",
      routeHash("search", undefined, params),
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  useEffect(() => {
    const labels: Record<Page, string> = {
      home: "会食の店選びを、丁寧に。",
      search: "お店を探す",
      detail: "店舗情報",
      about: "このサービスについて",
      admin: "掲載店登録",
    };
    document.title = `${labels[route.page]} | Executive Dining`;
  }, [route.page]);
  return (
    <AuthProvider>
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
        key={route.page}
        currentPage={route.page}
        onNavigate={handleNavigate}
      />
      <main id="main-content" tabIndex={-1}>
        {route.page === "home" && <Home onNavigate={handleNavigate} />}
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
        {route.page === "admin" && <Admin />}
        {route.page === "about" && <About onNavigate={handleNavigate} />}
      </main>
      <footer className="site-footer">
        <div className="page-width footer-inner">
          <span className="wordmark">EXECUTIVE DINING</span>
          <p>会食の店選びを、丁寧に。</p>
          <a href="#/about">掲載情報について</a>
          <a href="#/admin">掲載情報の下書き</a>
          <span>© {new Date().getFullYear()} Executive Dining</span>
        </div>
      </footer>
    </AuthProvider>
  );
}

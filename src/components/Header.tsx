import { useEffect, useRef, useState } from "react";
import { Bookmark, Menu, X } from "lucide-react";
import type { Page } from "../types";
import type { SearchParams } from "../lib/search";
import { useAuth } from "../contexts/auth";
import { useSavedRestaurants } from "../hooks/useSavedRestaurants";
import { emailSignInEnabled, googleSignInEnabled, supabase } from "../lib/supabase";
import EmailLoginForm from "./EmailLoginForm";
interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page, id?: string, params?: SearchParams) => void;
}
const items: { label: string; page: Page }[] = [
  { label: "お店を探す", page: "search" },
  { label: "名古屋の掲載情報", page: "nagoya" },
  { label: "このサービスについて", page: "about" },
];
export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [modal, setModal] = useState<"menu" | "login" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { savedIds } = useSavedRestaurants();
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    dialog.current?.close();
  }, [modal]);
  const navigate = (page: Page, params?: SearchParams) => {
    setModal(null);
    onNavigate(page, undefined, params ?? {});
  };
  const authenticate = async () => {
    setError("");
    setBusy(true);
    try {
      if (user) {
        await signOut();
        setModal(null);
      } else await signInWithGoogle();
    } catch {
      setError(
        "ログイン処理が完了しませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <header className="site-header">
        <div className="page-width header-inner">
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="Executive Dining ホーム"
          >
            <span className="brand-monogram">
              E<span>D</span>
            </span>
            <span className="wordmark">
              EXECUTIVE<span>DINING</span>
            </span>
          </button>
          <nav className="desktop-nav" aria-label="メインナビゲーション">
            {items.map((item) => (
              <button
                key={item.page}
                aria-current={currentPage === item.page ? "page" : undefined}
                onClick={() => navigate(item.page)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="header-saved"
              onClick={() => navigate("search", { saved: "1" })}
              aria-label={`保存した候補 ${savedIds.length}件`}
            >
              <Bookmark size={17} />
              <span>候補</span>
              <small>{savedIds.length}</small>
            </button>
            <button
              className="desktop-login"
              disabled={loading}
              onClick={() => {
                setError("");
                setModal("login");
              }}
            >
              {user ? "アカウント" : "ログイン"}
            </button>
            <button
              className="mobile-menu"
              onClick={() => setModal("menu")}
              aria-label="メニューを開く"
              aria-haspopup="dialog"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <dialog
        ref={dialog}
        className="site-dialog"
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setModal(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-content">
          <button
            className="dialog-close"
            onClick={() => setModal(null)}
            aria-label="閉じる"
          >
            <X size={22} />
          </button>
          <p className="eyebrow">EXECUTIVE DINING</p>
          <h2 id="dialog-title">
            {modal === "menu" ? "メニュー" : user ? "アカウント" : "ログイン"}
          </h2>
          {modal === "menu" ? (
            <nav className="dialog-nav" aria-label="モバイルナビゲーション">
              <button onClick={() => navigate("home")}>ホーム</button>
              {items.map((item) => (
                <button key={item.page} onClick={() => navigate(item.page)}>
                  {item.label}
                </button>
              ))}
              <button onClick={() => navigate("admin")}>
                掲載情報の下書き
              </button>
              <button
                onClick={() => {
                  setError("");
                  setModal("login");
                }}
              >
                {user ? "アカウント" : "ログイン"}
              </button>
            </nav>
          ) : (
            <>
              <p>
                検索と候補保存はログインせずに使えます。候補・下書きはこのブラウザ内に保存されます。
              </p>
              {!supabase || (!user && !googleSignInEnabled && !emailSignInEnabled) ? (
                <p className="sample-notice">ログイン機能は準備中です。</p>
              ) : (
                <>
                  {!user && emailSignInEnabled && <EmailLoginForm />}
                  {(user || googleSignInEnabled) && <><button
                    className="primary-button"
                    disabled={busy}
                    onClick={authenticate}
                  >
                    {busy
                      ? "処理中…"
                      : user
                        ? "ログアウト"
                        : "Googleでログイン"}
                  </button>
                  <p className="quiet-label">
                    {user ? user.email : "Googleの認証画面へ移動します。"}
                  </p></>}
                </>
              )}
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

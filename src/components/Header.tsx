import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Page } from '../types';
import { useAuth } from '../contexts/AuthContext';
import RankBadge from './RankBadge';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { label: string; page: Page }[] = [
  { label: 'ホーム', page: 'home' },
  { label: 'お店を探す', page: 'search' },
  { label: 'サービスについて', page: 'about' },
  { label: '掲載店登録', page: 'admin' },
];

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  const handleGoogleLogin = () => {
    signInWithGoogle();
    setShowLoginModal(false);
  };

  const handleNav = (page: Page) => {
    onNavigate(page);
    setShowMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-morphism border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer space-x-2"
              onClick={() => onNavigate('home')}
            >
              <div className="bg-slate-900 text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg shadow-xl">
                <span className="font-serif text-lg md:text-2xl">E</span>
              </div>
              <span className="text-base md:text-xl font-serif font-bold tracking-tight text-slate-900">
                EXECUTIVE <span className="text-slate-500">DINING</span>
              </span>
            </div>

            {/* Navigation (desktop) */}
            <nav className="hidden md:flex space-x-8">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`text-sm font-medium transition-colors ${currentPage === item.page ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right side: auth + hamburger */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {!loading && !user && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  ログイン
                </button>
              )}
              {!loading && user && (
                <div className="hidden md:flex items-center space-x-3">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                      {(profile?.displayName ?? user.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  {profile && <RankBadge rank={profile.rank} size="sm" />}
                  <button
                    onClick={() => signOut()}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              )}
              {/* Hamburger */}
              <button
                onClick={() => setShowMenu(true)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="メニューを開く"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hamburger Overlay Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-[200] flex">
          <div
            className="flex-1 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          <div className="w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <span className="font-serif font-bold text-slate-900">メニュー</span>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    currentPage === item.page
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="px-4 pb-8 space-y-2 border-t border-slate-100 pt-4">
              {!loading && !user ? (
                <>
                  <button
                    onClick={() => { setShowLoginModal(true); setShowMenu(false); }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                  >
                    ログイン
                  </button>
                  <button
                    onClick={() => { setShowLoginModal(true); setShowMenu(false); }}
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                  >
                    無料会員登録
                  </button>
                </>
              ) : !loading && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-2">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {(profile?.displayName ?? user.email ?? '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{profile?.displayName ?? user.email}</p>
                      {profile && <RankBadge rank={profile.rank} size="sm" />}
                    </div>
                  </div>
                  <button
                    onClick={() => { signOut(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="bg-slate-900 text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-xl mx-auto mb-6">
                <span className="font-serif text-3xl">E</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Executive Dining</h3>
              <p className="text-slate-500 text-sm mb-10">
                ビジネスエグゼクティブのための、<br />
                会食特化型口コミサイトへようこそ。
              </p>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-5 h-5"
                  alt="Google"
                />
                <span className="font-bold text-slate-700">Googleでログイン</span>
              </button>

              <div className="mt-8 text-xs text-slate-400">
                続行することで、
                <a href="#" className="underline">利用規約</a>および
                <a href="#" className="underline">プライバシーポリシー</a>
                に同意したものとみなされます。
              </div>
            </div>
            <div className="bg-slate-50 p-6 text-center">
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

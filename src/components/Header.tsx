import { useState } from 'react';
import type { Page } from '../types';
import { useAuth } from '../contexts/AuthContext';
import RankBadge from './RankBadge';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  const handleGoogleLogin = () => {
    signInWithGoogle();
    setShowLoginModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-morphism border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer space-x-2"
              onClick={() => onNavigate('home')}
            >
              <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-lg shadow-xl">
                <span className="font-serif text-2xl">E</span>
              </div>
              <span className="text-xl font-serif font-bold tracking-tight text-slate-900">
                EXECUTIVE <span className="text-slate-500">DINING</span>
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => onNavigate('home')}
                className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                ホーム
              </button>
              <button
                onClick={() => onNavigate('search')}
                className={`text-sm font-medium transition-colors ${currentPage === 'search' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                お店を探す
              </button>
              <button
                onClick={() => onNavigate('admin')}
                className={`text-sm font-medium transition-colors ${currentPage === 'admin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                掲載店登録
              </button>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {loading ? null : !user ? (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    ログイン
                  </button>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md"
                  >
                    無料会員登録
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
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
            </div>
          </div>
        </div>
      </header>

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

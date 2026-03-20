
import React, { ReactNode, useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  onNavigate: (path: string) => void;
  currentPath: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentPath }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleGoogleLogin = () => {
    // Mock login logic
    setTimeout(() => {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      alert('Googleアカウントでログインしました。');
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
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
                className={`text-sm font-medium transition-colors ${currentPath === 'home' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                ホーム
              </button>
              <button 
                onClick={() => onNavigate('search')}
                className={`text-sm font-medium transition-colors ${currentPath === 'search' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                お店を探す
              </button>
              <button 
                onClick={() => onNavigate('admin')}
                className={`text-sm font-medium transition-colors ${currentPath === 'admin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                掲載店登録
              </button>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                    <i className="fas fa-user text-slate-500"></i>
                  </div>
                  <span className="text-sm font-bold text-slate-700">マイページ</span>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-900"
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="bg-slate-900 text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-xl mx-auto mb-6">
                <span className="font-serif text-3xl">E</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Executive Dining</h3>
              <p className="text-slate-500 text-sm mb-10">ビジネスエグゼクティブのための、<br />会食特化型口コミサイトへようこそ。</p>
              
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm mb-4"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                <span className="font-bold text-slate-700">Googleでログイン</span>
              </button>
              
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">または</span></div>
              </div>

              <button className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                メールアドレスでログイン
              </button>

              <div className="mt-10 text-xs text-slate-400">
                続行することで、<a href="#" className="underline">利用規約</a>および<a href="#" className="underline">プライバシーポリシー</a>に同意したものとみなされます。
              </div>
            </div>
            <div className="bg-slate-50 p-6 text-center">
              <button onClick={() => setShowLoginModal(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600">閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="bg-white text-slate-900 w-8 h-8 flex items-center justify-center rounded">
                  <span className="font-serif text-lg">E</span>
                </div>
                <span className="text-xl font-serif font-bold tracking-tight text-white">
                  EXECUTIVE <span className="text-slate-500">DINING</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm mb-6">
                「成功するビジネスは、食卓から始まる」<br />
                会食特化型口コミサイトとして、ビジネスの質を高めます。
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">サービス</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => onNavigate('search')} className="hover:text-white">お店を探す</button></li>
                <li><button onClick={() => setShowLoginModal(true)} className="hover:text-white">口コミを投稿する</button></li>
                <li><button onClick={() => onNavigate('admin')} className="hover:text-white">掲載希望の飲食店様へ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">エリア別</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => onNavigate('search')} className="hover:text-white">東京の会食</button></li>
                <li><button onClick={() => onNavigate('search')} className="hover:text-white">大阪の会食</button></li>
                <li><button onClick={() => onNavigate('search')} className="hover:text-white">福岡の会食</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-16 pt-8 text-sm text-center">
            &copy; 2024 Executive Dining Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

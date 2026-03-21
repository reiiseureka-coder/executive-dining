import { useState } from 'react';
import { Menu, X, UtensilsCrossed, Search, Shield, LogIn, LogOut, ChevronDown } from 'lucide-react';
import type { Page } from '../types';
import { useAuth } from '../contexts/AuthContext';
import RankBadge from './RankBadge';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  const navItems: { label: string; page: Page }[] = [
    { label: 'ホーム', page: 'home' },
    { label: '店舗を探す', page: 'search' },
    { label: '管理画面', page: 'admin' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center group-hover:bg-indigo-400 transition-colors">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-white text-base font-semibold tracking-wide">
                Executive Dining
              </span>
              <span className="text-xs text-slate-400 tracking-widest hidden sm:block">
                エグゼクティブ・ダイニング
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === item.page
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => onNavigate('search')}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <Search size={18} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <Shield size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">厳選店</span>
            </div>

            {/* Auth area */}
            {loading ? null : !user ? (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogIn size={15} />
                Googleでログイン
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                  ) : (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {(profile?.displayName ?? user.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  {profile && <RankBadge rank={profile.rank} size="sm" />}
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">
                        {profile?.displayName ?? user.email}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === item.page
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
            {/* Mobile auth */}
            <div className="pt-2 border-t border-white/10">
              {!user ? (
                <button
                  onClick={() => { signInWithGoogle(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 text-sm font-semibold rounded-xl"
                >
                  <LogIn size={15} />
                  Googleでログイン
                </button>
              ) : (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 truncate max-w-[160px]">
                      {profile?.displayName ?? user.email}
                    </span>
                    {profile && <RankBadge rank={profile.rank} size="sm" />}
                  </div>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-slate-400 hover:text-white cursor-pointer">
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

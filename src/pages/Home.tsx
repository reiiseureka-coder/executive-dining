import { useState } from 'react';
import { Search, Shield, Star, ChevronRight, TrendingUp, Clock, Award, Sparkles } from 'lucide-react';
import type { Page } from '../types';
import { restaurants } from '../data/mockData';
import RestaurantCard from '../components/RestaurantCard';

interface HomeProps {
  onNavigate: (page: Page, restaurantId?: string, searchParams?: { query?: string }) => void;
}

const QUICK_AREAS = [
  { label: '銀座', region: '関東' },
  { label: '六本木', region: '関東' },
  { label: '恵比寿', region: '関東' },
  { label: '新宿', region: '関東' },
  { label: '大阪', region: '関西' },
  { label: '京都', region: '関西' },
];

const STATS = [
  { icon: Shield, value: '97%', label: '会食成功率', color: 'text-emerald-400' },
  { icon: Star, value: '4.7', label: '平均評価', color: 'text-yellow-400' },
  { icon: TrendingUp, value: '2,400+', label: '累計口コミ数', color: 'text-indigo-400' },
  { icon: Award, value: '厳選', label: 'エグゼクティブ認定店', color: 'text-amber-400' },
];

export default function Home({ onNavigate }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const featuredRestaurants = restaurants.slice(0, 3);

  const handleSearch = () => {
    onNavigate('search', undefined, { query: searchQuery });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-900/50" />
          {/* Decorative orbs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-8">
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-indigo-300 text-sm font-medium">AI × ビジネス会食特化プラットフォーム</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              会食の成否は、
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                店選びで決まる。
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
              料理の味だけでない。<strong className="text-white">個室の機密性</strong>、
              <strong className="text-white">接客の洗練さ</strong>、
              <strong className="text-white">タクシーの捕まえやすさ</strong>まで。
              <br />
              ビジネスエグゼクティブが本当に必要な情報を、AIが分析してお届けします。
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="エリア、料理ジャンル、シーンで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/15 transition-all text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Search size={18} />
                店を探す
              </button>
            </div>

            {/* Quick area buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-slate-400 text-sm py-2">エリアで絞り込み:</span>
              {QUICK_AREAS.map((area) => (
                <button
                  key={area.label}
                  onClick={() => onNavigate('search', undefined, { query: area.label })}
                  className="px-4 py-1.5 bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/30 rounded-full text-sm text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-5">
                  <stat.icon size={20} className={stat.color} />
                  <div>
                    <div className={`font-bold text-xl ${stat.color}`}>{stat.value}</div>
                    <div className="text-slate-400 text-xs">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-4 py-1.5 mb-4">
              <Shield size={14} className="text-indigo-500" />
              <span className="text-indigo-600 text-sm font-medium">なぜ Executive Dining なのか</span>
            </div>
            <h2 className="font-serif text-4xl font-bold text-slate-900 mb-4">
              接待に特化した、唯一の評価軸
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              一般的なグルメサイトでは分からない、ビジネスシーンで本当に重要な情報を提供します。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔒',
                title: '機密性・個室評価',
                desc: '防音性能、視線の遮蔽、会話の漏れやすさなど、重要な商談に必要な環境を詳細に評価。完全個室かどうかだけでなく、実際の使用感を口コミで確認。',
              },
              {
                icon: '🤖',
                title: 'AI ビジネス診断',
                desc: 'Gemini AI が複数の口コミを統合分析。「役員接待に最適か」「機密性は保たれるか」「どんな会食シーンに向くか」を総合スコアで可視化。',
              },
              {
                icon: '🚖',
                title: 'アクセス・帰宅動線',
                desc: '会食後のタクシーの捕まえやすさ、ハイヤー駐車スペース、最寄り駅の具体的な出口まで。スムーズな帰宅を実現する実践的な情報を提供。',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-serif text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-indigo-500" />
                <span className="text-indigo-600 text-sm font-medium">編集部 厳選</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-slate-900">
                今週のエグゼクティブ推薦店
              </h2>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="hidden sm:flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 font-medium text-sm transition-colors cursor-pointer"
            >
              すべて見る
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={(id) => onNavigate('detail', id)}
                featured
              />
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-700 transition-colors cursor-pointer"
            >
              すべての店舗を見る
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-white mb-4">
            次の会食、失敗できますか？
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            重要な商談、役員接待、海外VIPのおもてなし。<br />
            店選びのリスクを、AIの力でゼロに近づけましょう。
          </p>
          <button
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 cursor-pointer text-lg"
          >
            今すぐ店を探す
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-white font-semibold">Executive Dining</span>
              <span className="text-slate-500 text-xs">© 2026 All rights reserved.</span>
            </div>
            <p className="text-slate-500 text-xs text-center">
              AI による分析は参考情報です。最終的な判断はご自身でお願いします。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

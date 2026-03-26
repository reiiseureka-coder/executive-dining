import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../App';
import { restaurants } from '../data/mockData';
import RestaurantCard from '../components/RestaurantCard';

interface HomeProps {
  onNavigate: (page: Page, restaurantId?: string, searchParams?: SearchParams) => void;
}

const FILTER_CHIPS: { label: string; params: SearchParams }[] = [
  { label: '東京', params: { region: '関東' } },
  { label: '大阪', params: { query: '大阪' } },
  { label: '京都', params: { query: '京都' } },
  { label: '個室あり', params: { privateRoom: '完全個室' } },
  { label: 'ランチ', params: { query: 'ランチ' } },
  { label: 'ディナー', params: { query: 'ディナー' } },
];

const CITIES = [
  { name: '東京', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800' },
  { name: '大阪', image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&q=80&w=800' },
  { name: '京都', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800' },
  { name: '福岡', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&q=80&w=800' },
];

export default function Home({ onNavigate }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const featuredRestaurants = restaurants.slice(0, 3);

  const handleSearch = () => {
    onNavigate('search', undefined, { query: searchQuery });
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover brightness-[0.4]"
            alt="Hero background"
          />
        </div>
        <div className="relative z-10 text-center px-4 w-full max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-serif text-white mb-4 md:mb-6 tracking-tight leading-tight">
            会食の成否は、<br className="md:hidden" />店選びで決まる。
          </h1>
          <p className="text-slate-300 text-sm sm:text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            ビジネスエグゼクティブのための、会食特化型口コミサイト。<br className="hidden md:block" />
            リアルな声に基づいた、失敗しない接待体験を。
          </p>

          <div className="bg-white p-1.5 md:p-2 rounded-full shadow-2xl flex max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="エリア、ジャンル、キーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-grow px-4 md:px-6 py-2.5 md:py-3 rounded-full focus:outline-none text-slate-800 text-sm md:text-base"
            />
            <button
              onClick={handleSearch}
              className="bg-slate-900 text-white px-5 md:px-8 py-2.5 md:py-3 rounded-full font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 md:gap-2 text-sm md:text-base"
            >
              <Search size={15} /> 検索
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => onNavigate('search', undefined, chip.params)}
                className="bg-white/20 border border-white/30 text-white text-xs sm:text-sm px-3 py-1.5 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Areas */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">主要エリアから探す</h2>
            <p className="text-slate-500">全国のビジネス拠点から最適な一軒を。</p>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-slate-900 font-semibold flex items-center hover:translate-x-1 transition-transform"
          >
            全てのエリアを表示 <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CITIES.map((city) => (
            <div
              key={city.name}
              onClick={() => onNavigate('search', undefined, { query: city.name })}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
            >
              <img
                src={city.image}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={city.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                <h3 className="text-white font-bold text-xl">{city.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Service Teaser */}
      <section className="py-14 md:py-20 bg-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-slate-500 uppercase tracking-widest text-xs sm:text-sm font-bold">Why Executive Dining</span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mt-2 mb-4">
            接待に特化した、唯一の評価軸
          </h2>
          <div className="w-12 h-1 bg-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            一般的なグルメサイトでは分からない、ビジネスシーンで本当に重要な情報を提供します。
          </p>
          <button
            onClick={() => onNavigate('about')}
            className="inline-flex items-center gap-2 text-slate-900 font-semibold border border-slate-300 px-6 py-3 rounded-full hover:bg-slate-200 transition-all text-sm md:text-base"
          >
            詳しく見る <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-slate-500 uppercase tracking-widest text-sm font-bold">Selection</span>
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 mt-2">全国の厳選店</h2>
            <div className="w-16 h-1 bg-slate-900 mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={(id) => onNavigate('detail', id)}
                featured
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-slate-800 transition-all shadow-md"
            >
              すべての店舗を見る <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl md:text-4xl font-bold text-white mb-4">
            次の会食、失敗できますか？
          </h2>
          <p className="text-slate-300 text-lg mb-10">
            重要な商談、役員接待、海外VIPのおもてなし。<br />
            店選びのリスクを、AIの力でゼロに近づけましょう。
          </p>
          <button
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-slate-100 transition-all shadow-lg text-lg"
          >
            今すぐ店を探す <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
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
              <p className="text-sm leading-relaxed max-w-sm">
                「成功するビジネスは、食卓から始まる」<br />
                会食特化型口コミサイトとして、ビジネスの質を高めます。
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">サービス</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => onNavigate('search')} className="hover:text-white transition-colors">お店を探す</button></li>
                <li><button onClick={() => onNavigate('search')} className="hover:text-white transition-colors">口コミを投稿する</button></li>
                <li><button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">掲載希望の飲食店様へ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">エリア別</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => onNavigate('search', undefined, { query: '東京' })} className="hover:text-white transition-colors">東京の会食</button></li>
                <li><button onClick={() => onNavigate('search', undefined, { query: '大阪' })} className="hover:text-white transition-colors">大阪の会食</button></li>
                <li><button onClick={() => onNavigate('search', undefined, { query: '福岡' })} className="hover:text-white transition-colors">福岡の会食</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-16 pt-8 text-sm text-center">
            &copy; 2026 Executive Dining Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

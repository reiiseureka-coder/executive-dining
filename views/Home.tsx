
import React from 'react';
import { mockRestaurants } from '../data/mockData';
import { Area } from '../types';

interface HomeProps {
  onNavigate: (path: string, params?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const cities: { name: Area; image: string }[] = [
    { name: '東京', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800' },
    { name: '大阪', image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&q=80&w=800' },
    { name: '京都', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800' },
    { name: '福岡', image: 'https://images.unsplash.com/photo-1512464080551-214440347719?auto=format&fit=crop&q=80&w=800' },
  ];

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
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 tracking-tight">
            会食の成否は、<br className="md:hidden" />店選びで決まる。
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            ビジネスエグゼクティブのための、会食特化型口コミサイト。<br className="hidden md:block" />
            リアルな声に基づいた、失敗しない接待体験を。
          </p>
          
          <div className="bg-white p-2 rounded-full shadow-2xl flex max-w-2xl mx-auto">
            <input 
              type="text" 
              placeholder="エリア、ジャンル、キーワードで検索..."
              className="flex-grow px-6 py-3 rounded-full focus:outline-none text-slate-800"
            />
            <button 
              onClick={() => onNavigate('search')}
              className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all flex items-center"
            >
              <i className="fas fa-search mr-2"></i> 検索
            </button>
          </div>
        </div>
      </section>

      {/* Featured Areas */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">主要エリアから探す</h2>
            <p className="text-slate-500">全国のビジネス拠点から最適な一軒を。</p>
          </div>
          <button onClick={() => onNavigate('search')} className="text-slate-900 font-semibold flex items-center hover:translate-x-1 transition-transform">
            全てのエリアを表示 <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cities.map((city) => (
            <div 
              key={city.name}
              onClick={() => onNavigate('search', { area: city.name })}
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

      {/* Recommended Restaurants */}
      <section className="py-24 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-slate-500 uppercase tracking-widest text-sm font-bold">Selection</span>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mt-2">全国の厳選店</h2>
            <div className="w-16 h-1 bg-slate-900 mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockRestaurants.map((res) => (
              <div 
                key={res.id}
                onClick={() => onNavigate('detail', { id: res.id })}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 cursor-pointer group"
              >
                <div className="relative h-64">
                  <img src={res.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={res.name} />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-slate-900">
                    {res.genre}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{res.name}</h3>
                    <div className="flex items-center text-yellow-500 font-bold">
                      <i className="fas fa-star mr-1"></i> {res.avgRating}
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{res.description}</p>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-slate-100 pt-4">
                    <div className="flex items-center text-slate-600">
                      <i className="fas fa-map-marker-alt w-5 text-slate-400"></i> {res.area}
                    </div>
                    <div className="flex items-center text-slate-600">
                      <i className="fas fa-yen-sign w-5 text-slate-400"></i> {res.priceRange}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

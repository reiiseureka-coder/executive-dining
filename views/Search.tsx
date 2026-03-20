
import React, { useState } from 'react';
import { mockRestaurants } from '../data/mockData';
import { Area, Region, Genre } from '../types';

interface SearchProps {
  onNavigate: (path: string, params?: any) => void;
  initialArea?: Area;
}

const Search: React.FC<SearchProps> = ({ onNavigate, initialArea }) => {
  const [selectedRegion, setSelectedRegion] = useState<Region | 'すべて'>('すべて');
  const [selectedArea, setSelectedArea] = useState<Area | 'すべて'>(initialArea || 'すべて');
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'すべて'>('すべて');
  
  const regions: (Region | 'すべて')[] = ['すべて', '関東', '関西', '九州', '中部', '北海道・東北', '中国・四国'];
  const areasByRegion: Record<Region, Area[]> = {
    '関東': ['東京', '横浜'],
    '関西': ['大阪', '京都'],
    '九州': ['福岡'],
    '中部': ['名古屋'],
    '北海道・東北': ['札幌', '仙台'],
    '中国・四国': ['広島']
  };

  const genres: (Genre | 'すべて')[] = ['すべて', '日本料理', '寿司', 'イタリアン', 'フレンチ', '中華', '焼肉', 'ステーキ', '居酒屋'];

  const filteredRestaurants = mockRestaurants.filter(res => {
    if (selectedRegion !== 'すべて' && res.region !== selectedRegion) return false;
    if (selectedArea !== 'すべて' && res.area !== selectedArea) return false;
    if (selectedGenre !== 'すべて' && res.genre !== selectedGenre) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar */}
        <aside className="w-full lg:w-72 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <i className="fas fa-filter mr-2 text-slate-400"></i> 検索条件
            </h3>

            {/* Region Filter */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">地方</label>
              <select 
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value as any);
                  setSelectedArea('すべて');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Area Filter */}
            {selectedRegion !== 'すべて' && (
              <div className="mb-6 animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">主要エリア</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedArea('すべて')}
                    className={`block w-full text-left px-4 py-2 rounded-lg text-sm ${selectedArea === 'すべて' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    すべて
                  </button>
                  {areasByRegion[selectedRegion as Region].map(a => (
                    <button
                      key={a}
                      onClick={() => setSelectedArea(a)}
                      className={`block w-full text-left px-4 py-2 rounded-lg text-sm ${selectedArea === a ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Genre Filter */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">ジャンル</label>
              <select 
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-grow">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            {selectedArea === 'すべて' ? (selectedRegion === 'すべて' ? '全国' : selectedRegion) : selectedArea}の飲食店
            <span className="ml-4 text-sm font-normal text-slate-400">{filteredRestaurants.length}件</span>
          </h2>

          <div className="space-y-6">
            {filteredRestaurants.map(res => (
              <div 
                key={res.id}
                onClick={() => onNavigate('detail', { id: res.id })}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row cursor-pointer group"
              >
                <div className="w-full md:w-80 h-64 md:h-auto overflow-hidden">
                  <img src={res.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={res.name} />
                </div>
                <div className="p-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{res.genre}</span>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{res.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-yellow-500 font-bold text-xl">
                        <i className="fas fa-star mr-1"></i> {res.avgRating}
                      </div>
                      <span className="text-xs text-slate-400">{res.reviewCount} 件</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2">{res.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 border-t border-slate-50 pt-4">
                    <div className="flex items-center"><i className="fas fa-map-marker-alt w-5 text-slate-400"></i> {res.area}</div>
                    <div className="flex items-center"><i className="fas fa-yen-sign w-5 text-slate-400"></i> {res.priceRange}</div>
                    {/* Fix: use privateRoomType instead of the non-existent hasPrivateRoom property */}
                    <div className="flex items-center"><i className="fas fa-door-closed w-5 text-slate-400"></i> {res.privateRoomType !== 'なし' ? '個室あり' : '個室なし'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Search;

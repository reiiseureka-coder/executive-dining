import { useState, useMemo, useEffect } from 'react';
import { Search as SearchIcon, SlidersHorizontal, X, MapPin, Lock, TrendingUp, ChevronDown } from 'lucide-react';
import type { Page } from '../types';
import { restaurants } from '../data/mockData';
import RestaurantCard from '../components/RestaurantCard';

interface SearchProps {
  onNavigate: (page: Page, restaurantId?: string, searchParams?: { query?: string }) => void;
  initialQuery?: string;
  initialRegion?: string;
  initialPrivateRoom?: string;
}

const REGIONS = ['すべて', '関東', '関西', '東海', '九州', '北海道・東北', '中国・四国'];
const AREAS = {
  '関東': ['すべて', '銀座', '六本木', '恵比寿', '新宿', '渋谷', '赤坂', '丸の内'],
  '関西': ['すべて', '大阪・北堀江', '大阪・梅田', '京都・南禅寺', '神戸'],
  '東海': ['すべて', '名古屋・栄', '名古屋・伏見'],
  '九州': ['すべて', '福岡・天神', '福岡・博多'],
  '北海道・東北': ['すべて', '札幌・中心部', '仙台'],
  '中国・四国': ['すべて', '広島', '高松'],
};
const GENRES = ['すべて', '寿司', '日本料理', '京懐石', '日本料理・創作', '鉄板焼・ステーキ', 'フレンチ・創作', 'フレンチ', 'イタリアン', '中国料理'];
const PRIVATE_ROOM_TYPES = ['すべて', '完全個室', '半個室', 'なし'];
const SORT_OPTIONS = [
  { value: 'score', label: 'ビジネススコア順' },
  { value: 'rating', label: '評価順' },
  { value: 'price_asc', label: '価格: 安い順' },
  { value: 'price_desc', label: '価格: 高い順' },
];

export default function Search({ onNavigate, initialQuery = '', initialRegion, initialPrivateRoom }: SearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion ?? 'すべて');
  const [selectedArea, setSelectedArea] = useState('すべて');
  const [selectedGenre, setSelectedGenre] = useState('すべて');
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState(initialPrivateRoom ?? 'すべて');
  const [sortBy, setSortBy] = useState('score');
  const [showFilters, setShowFilters] = useState(!!(initialRegion || initialPrivateRoom));

  useEffect(() => {
    if (initialRegion || initialPrivateRoom) setShowFilters(true);
  }, [initialRegion, initialPrivateRoom]);

  const currentAreas = selectedRegion !== 'すべて' ? AREAS[selectedRegion as keyof typeof AREAS] || ['すべて'] : ['すべて'];

  const filtered = useMemo(() => {
    let result = [...restaurants];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.includes(query) ||
          r.genre.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.description.includes(query) ||
          r.tags.some((t) => t.includes(query))
      );
    }

    if (selectedRegion !== 'すべて') {
      result = result.filter((r) => r.region === selectedRegion);
    }

    if (selectedArea !== 'すべて') {
      result = result.filter((r) => r.area.includes(selectedArea));
    }

    if (selectedGenre !== 'すべて') {
      result = result.filter((r) => r.genre === selectedGenre);
    }

    if (selectedPrivateRoom !== 'すべて') {
      result = result.filter((r) => r.privateRoomType === selectedPrivateRoom);
    }

    switch (sortBy) {
      case 'score':
        result.sort((a, b) => b.overallBusinessScore - a.overallBusinessScore);
        break;
      case 'rating':
        result.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case 'price_asc':
        result.sort((a, b) => a.avgPricePerPerson - b.avgPricePerPerson);
        break;
      case 'price_desc':
        result.sort((a, b) => b.avgPricePerPerson - a.avgPricePerPerson);
        break;
    }

    return result;
  }, [query, selectedRegion, selectedArea, selectedGenre, selectedPrivateRoom, sortBy]);

  const activeFilterCount = [
    selectedRegion !== 'すべて',
    selectedArea !== 'すべて',
    selectedGenre !== 'すべて',
    selectedPrivateRoom !== 'すべて',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedRegion('すべて');
    setSelectedArea('すべて');
    setSelectedGenre('すべて');
    setSelectedPrivateRoom('すべて');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-slate-900 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-2xl font-bold text-white mb-4">
            ビジネス会食店を探す
          </h1>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="店名、エリア、料理ジャンルで検索..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all cursor-pointer ${
                showFilters || activeFilterCount > 0
                  ? 'bg-indigo-500 border-indigo-400 text-white'
                  : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/15'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">フィルター</span>
              {activeFilterCount > 0 && (
                <span className="bg-white text-indigo-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Region */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">地方</label>
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedArea('すべて');
                    }}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 cursor-pointer pr-8"
                  >
                    {REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">エリア</label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    disabled={selectedRegion === 'すべて'}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 cursor-pointer pr-8 disabled:opacity-40"
                  >
                    {currentAreas.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">ジャンル</label>
                <div className="relative">
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 cursor-pointer pr-8"
                  >
                    {GENRES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Private Room */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">個室タイプ</label>
                <div className="relative">
                  <select
                    value={selectedPrivateRoom}
                    onChange={(e) => setSelectedPrivateRoom(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 cursor-pointer pr-8"
                  >
                    {PRIVATE_ROOM_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X size={14} />
                  フィルターをクリア
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-slate-600 text-sm">
              <strong className="text-slate-900 text-lg">{filtered.length}</strong> 件の会食店
            </span>
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
                <SlidersHorizontal size={11} />
                フィルター適用中
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">並び替え:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer pr-7"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={(id) => onNavigate('detail', id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon size={24} className="text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-semibold text-lg mb-2">条件に合う店舗が見つかりません</h3>
            <p className="text-slate-400 text-sm mb-4">検索条件を変更してみてください。</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              フィルターをリセット
            </button>
          </div>
        )}

        {/* Business tips */}
        {filtered.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-3">
              <Lock size={18} className="text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-800 text-sm mb-1">機密性が重要な場合</p>
                <p className="text-slate-500 text-xs">「完全個室」でフィルタリングし、機密性スコアが4以上の店舗を選びましょう。</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3">
              <MapPin size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-800 text-sm mb-1">アクセスが重要な場合</p>
                <p className="text-slate-500 text-xs">地方から来客がある場合は、新幹線停車駅や空港リムジンバス停留所に近いエリアを優先してください。</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
              <TrendingUp size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-800 text-sm mb-1">海外VIP接待の場合</p>
                <p className="text-xs text-slate-500">日本文化体験を重視するなら、京懐石・老舗寿司を。英語対応はプロフィールで確認を。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

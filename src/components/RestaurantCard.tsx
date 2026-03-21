import { Star, MapPin, Users, Lock, TrendingUp, ChevronRight } from 'lucide-react';
import type { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (id: string) => void;
  featured?: boolean;
}

const GENRE_COLORS: Record<string, string> = {
  '寿司': 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  '京懐石': 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  '日本料理・創作': 'bg-teal-500/15 text-teal-300 border-teal-500/20',
  '鉄板焼・ステーキ': 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  '日本料理': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  'フレンチ・創作': 'bg-violet-500/15 text-violet-300 border-violet-500/20',
};

const PRIVATE_ROOM_BADGE: Record<string, { label: string; color: string }> = {
  '完全個室': { label: '完全個室', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  '半個室': { label: '半個室', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  '部屋個室': { label: '部屋個室', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'なし': { label: '個室なし', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < Math.round(value) ? 'bg-indigo-400' : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export default function RestaurantCard({ restaurant, onClick, featured = false }: RestaurantCardProps) {
  const privBadge = PRIVATE_ROOM_BADGE[restaurant.privateRoomType];
  const genreColor = GENRE_COLORS[restaurant.genre] || 'bg-slate-500/15 text-slate-300 border-slate-500/20';

  return (
    <div
      onClick={() => onClick(restaurant.id)}
      className={`group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-300 cursor-pointer ${
        featured ? 'hover:-translate-y-1' : 'hover:-translate-y-0.5'
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Business score badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1">
          <TrendingUp size={11} className="text-indigo-400" />
          <span className="text-xs font-bold text-white">{restaurant.overallBusinessScore}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>

        {/* Private room badge */}
        <div className="absolute top-3 left-3">
          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${privBadge.color}`}>
            <Lock size={10} />
            {privBadge.label}
          </span>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${genreColor}`}>
              {restaurant.genre}
            </span>
            <span className="text-white font-bold text-sm">{restaurant.priceRange}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-serif text-slate-900 font-semibold text-lg leading-tight">
              {restaurant.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{restaurant.nameEn}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-slate-800 text-sm">{restaurant.avgRating}</span>
            <span className="text-xs text-slate-400">({restaurant.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <MapPin size={12} />
          <span>{restaurant.area}</span>
          <span className="text-slate-300">·</span>
          <span>{restaurant.nearestStation}</span>
        </div>

        {/* Business specs mini bars */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-16 shrink-0">接客</span>
            <ScoreBar value={restaurant.businessSpecs.serviceQuality} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-16 shrink-0">静かさ</span>
            <ScoreBar value={restaurant.businessSpecs.quietness} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-16 shrink-0">機密性</span>
            <ScoreBar value={restaurant.businessSpecs.confidentiality} />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users size={12} />
            <span>{restaurant.privateRoomCapacity}</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-500 text-sm font-medium group-hover:gap-2 transition-all">
            <span>詳細を見る</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

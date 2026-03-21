import { Star, MapPin, Lock, TrendingUp } from 'lucide-react';
import type { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (id: string) => void;
  featured?: boolean;
}

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < Math.round(value) ? 'bg-slate-700' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function RestaurantCard({ restaurant, onClick, featured = false }: RestaurantCardProps) {
  return (
    <div
      onClick={() => onClick(restaurant.id)}
      className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 cursor-pointer ${
        featured ? 'hover:-translate-y-1' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop';
          }}
        />
        {/* Genre badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-slate-900">
          {restaurant.genre}
        </div>
        {/* Business score */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-slate-900 flex items-center gap-1">
          <TrendingUp size={11} className="text-slate-600" />
          {restaurant.overallBusinessScore}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-serif font-bold text-slate-900">{restaurant.name}</h3>
          <div className="flex items-center text-yellow-500 font-bold shrink-0 ml-2">
            <Star size={14} className="fill-yellow-400 mr-1" />
            {restaurant.avgRating}
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{restaurant.description}</p>

        {/* Business specs score bars */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-12 shrink-0">接客</span>
            <ScoreBar value={restaurant.businessSpecs.serviceQuality} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-12 shrink-0">静かさ</span>
            <ScoreBar value={restaurant.businessSpecs.quietness} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-12 shrink-0">機密性</span>
            <ScoreBar value={restaurant.businessSpecs.confidentiality} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-slate-100 pt-4">
          <div className="flex items-center text-slate-600">
            <MapPin size={12} className="text-slate-400 mr-1" /> {restaurant.area}
          </div>
          <div className="flex items-center text-slate-600">
            <span className="text-slate-400 mr-1 font-bold">¥</span> {restaurant.priceRange}
          </div>
          <div className="flex items-center text-slate-600 col-span-2 mt-1">
            <Lock size={12} className="text-slate-400 mr-1" /> {restaurant.privateRoomType}
          </div>
        </div>
      </div>
    </div>
  );
}

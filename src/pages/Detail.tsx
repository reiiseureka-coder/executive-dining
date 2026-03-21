import { useState } from 'react';
import {
  ArrowLeft, Star, MapPin, Lock, Phone, Users, Car, Train,
  Sparkles, CheckCircle, AlertCircle, ChevronRight, ThumbsUp, Send,
  TrendingUp, Volume2, Shield, Heart, Loader2, Navigation, Wine
} from 'lucide-react';
import type { Page, AIAnalysis, AIAccessGuide, Review } from '../types';
import { restaurants, reviews as allReviews } from '../data/mockData';
import { analyzeRestaurantForBusiness, getAccessGuide } from '../services/gemini';
import StarRating from '../components/StarRating';

interface DetailProps {
  restaurantId: string;
  onNavigate: (page: Page, id?: string) => void;
}

const SPEC_ICONS: Record<string, React.ReactNode> = {
  serviceQuality: <Heart size={14} />,
  quietness: <Volume2 size={14} />,
  accessEase: <Train size={14} />,
  confidentiality: <Shield size={14} />,
  ambiance: <Star size={14} />,
};
const SPEC_LABELS: Record<string, string> = {
  serviceQuality: '接客の洗練さ',
  quietness: '静かさ',
  accessEase: 'アクセス',
  confidentiality: '機密性',
  ambiance: '雰囲気・格式',
};

const SUITABILITY_CONFIG = {
  '最適': { bg: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-500/40', label: '役員接待に最適' },
  '適切': { bg: 'bg-indigo-500', text: 'text-indigo-300', border: 'border-indigo-500/40', label: '接待に適切' },
  '条件付き': { bg: 'bg-yellow-500', text: 'text-yellow-300', border: 'border-yellow-500/40', label: '条件次第で適切' },
  '不適': { bg: 'bg-red-500', text: 'text-red-300', border: 'border-red-500/40', label: '接待には不向き' },
};

function SpecBar({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-28 shrink-0">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs text-slate-300">{label}</span>
      </div>
      <div className="flex-1 bg-slate-700/50 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-700"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-bold text-white w-4 text-right">{value}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {review.author[0]}
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">{review.author}</p>
              <p className="text-xs text-slate-400">{review.authorRole}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <StarRating value={review.rating} readonly size={14} />
          <span className="text-xs text-slate-400 ml-1">{review.date}</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-1">利用シーン</p>
        <p className="text-sm text-slate-700">{review.occasion}</p>
      </div>

      <p className="text-slate-600 text-sm leading-relaxed mb-3">{review.comment}</p>

      {review.privateRoomDetail && (
        <div className="flex items-start gap-2 bg-indigo-50 rounded-lg p-3 mb-3 border border-indigo-100">
          <Lock size={13} className="text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-indigo-700 mb-0.5">個室レポート</p>
            <p className="text-xs text-indigo-600">{review.privateRoomDetail}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex gap-4">
          {(
            [
              ['serviceQuality', '接客'],
              ['quietness', '静かさ'],
              ['confidentiality', '機密性'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="text-center">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="text-sm font-bold text-slate-700">{review[key as keyof Review]}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <ThumbsUp size={12} />
          <span>{review.helpfulCount}</span>
        </div>
      </div>
    </div>
  );
}

export default function Detail({ restaurantId, onNavigate }: DetailProps) {
  const restaurant = restaurants.find((r) => r.id === restaurantId);
  const reviews = allReviews.filter((r) => r.restaurantId === restaurantId);

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiAccess, setAiAccess] = useState<AIAccessGuide | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [accessError, setAccessError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'write'>('overview');

  // Review form state
  const [formData, setFormData] = useState({
    author: '',
    authorRole: '',
    rating: 0,
    serviceQuality: 0,
    quietness: 0,
    accessEase: 0,
    confidentiality: 0,
    ambiance: 0,
    comment: '',
    privateRoomDetail: '',
    priceSpent: '',
    occasion: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">店舗が見つかりません</p>
          <button onClick={() => onNavigate('search')} className="text-indigo-500 hover:underline cursor-pointer">
            店舗一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    setAnalysisError('');
    try {
      const result = await analyzeRestaurantForBusiness(restaurant, reviews);
      setAiAnalysis(result);
    } catch (e) {
      setAnalysisError('AI分析に失敗しました。APIキーを確認してください。');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleAccessGuide = async () => {
    setLoadingAccess(true);
    setAccessError('');
    try {
      const result = await getAccessGuide(restaurant);
      setAiAccess(result);
    } catch (e) {
      setAccessError('アクセスガイドの取得に失敗しました。');
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const suitability = aiAnalysis?.executiveSuitability
    ? SUITABILITY_CONFIG[aiAnalysis.executiveSuitability]
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Image */}
      <div className="relative h-72 sm:h-96 bg-slate-800 overflow-hidden">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-70"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        <button
          onClick={() => onNavigate('search')}
          className="absolute top-4 left-4 flex items-center gap-2 glass text-white px-3 py-2 rounded-xl text-sm hover:bg-white/15 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">一覧に戻る</span>
        </button>

        {/* Business Score */}
        <div className="absolute top-4 right-4 flex flex-col items-center bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp size={14} className="text-indigo-400" />
            <span className="text-xs text-slate-400">ビジネススコア</span>
          </div>
          <span className="text-3xl font-bold text-white">{restaurant.overallBusinessScore}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs font-medium px-3 py-1 bg-indigo-500/80 text-white rounded-full">
              {restaurant.genre}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
              restaurant.privateRoomType === '完全個室'
                ? 'bg-emerald-500/80 text-white border-emerald-400/50'
                : restaurant.privateRoomType === '半個室'
                ? 'bg-yellow-500/80 text-white border-yellow-400/50'
                : restaurant.privateRoomType === '部屋個室'
                ? 'bg-blue-500/80 text-white border-blue-400/50'
                : 'bg-slate-500/80 text-white border-slate-400/50'
            }`}>
              {restaurant.privateRoomType}
            </span>
            {restaurant.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 bg-white/10 text-white rounded-full border border-white/20">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            {restaurant.name}
          </h1>
          <p className="text-slate-300 text-sm mt-1">{restaurant.nameEn}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">
        {/* Quick Info Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <strong>{restaurant.avgRating}</strong>
              <span className="text-slate-400">({restaurant.reviewCount}件)</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin size={16} className="text-slate-400" />
              {restaurant.area} · {restaurant.nearestStation}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Users size={16} className="text-slate-400" />
              {restaurant.privateRoomCapacity}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              {restaurant.priceRange}
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${restaurant.tel}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Phone size={14} />
              予約
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {[
            { key: 'overview', label: '店舗情報 & AI診断' },
            { key: 'reviews', label: `口コミ (${reviews.length})` },
            { key: 'write', label: '口コミを書く' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-serif text-xl font-semibold text-slate-900 mb-3">店舗概要</h2>
              <p className="text-slate-600 leading-relaxed">{restaurant.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {restaurant.recommendedFor.map((scene) => (
                  <span key={scene} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">
                    {scene}
                  </span>
                ))}
              </div>
            </div>

            {/* Business Specs */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-indigo-400" />
                <h2 className="font-serif text-xl font-semibold text-white">ビジネス適性スペック</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(restaurant.businessSpecs).map(([key, value]) => (
                  <SpecBar
                    key={key}
                    value={value}
                    label={SPEC_LABELS[key] || key}
                    icon={SPEC_ICONS[key]}
                  />
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={14} className="text-yellow-400" />
                    <span className="text-xs text-slate-400">接客レベル</span>
                  </div>
                  <div className="flex items-center justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < (restaurant.serviceLevel ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Car size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400">タクシー手配</span>
                  </div>
                  <div className="flex items-center justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < restaurant.taxiEase ? 'bg-yellow-400' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Lock size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400">個室タイプ</span>
                  </div>
                  <span className="text-sm font-medium text-white">{restaurant.privateRoomType}</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Wine size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400">飲み放題</span>
                  </div>
                  <span className="text-sm font-medium text-white">{restaurant.drinkAllInclusive ? 'あり' : 'なし'}</span>
                </div>
              </div>
            </div>

            {/* AI Business Concierge */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl border border-indigo-500/20 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-white">AI ビジネス・コンシェルジュ診断</h2>
                    <p className="text-xs text-indigo-300">Powered by Gemini AI</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  口コミを統合分析し、重要な商談・役員接待への適性をスコアリングします。
                </p>

                {!aiAnalysis && !loadingAnalysis && (
                  <button
                    onClick={handleAnalyze}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
                  >
                    <Sparkles size={16} />
                    AI 診断を実行する
                  </button>
                )}

                {loadingAnalysis && (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <Loader2 size={32} className="text-indigo-400 animate-spin" />
                    <p className="text-slate-400 text-sm">口コミを分析中...</p>
                  </div>
                )}

                {analysisError && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{analysisError}</p>
                  </div>
                )}

                {aiAnalysis && suitability && (
                  <div className="space-y-5">
                    {/* Score + Suitability */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-white">{aiAnalysis.businessScore}</div>
                        <div className="text-xs text-slate-400">/ 100</div>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            style={{ width: `${aiAnalysis.businessScore}%` }}
                          />
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${suitability.border} ${suitability.text} bg-white/5`}>
                          <div className={`w-2 h-2 rounded-full ${suitability.bg}`} />
                          {suitability.label}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-slate-300 text-sm leading-relaxed">{aiAnalysis.summary}</p>
                    </div>

                    {/* Pros / Cons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                          <CheckCircle size={12} /> 強み
                        </p>
                        <ul className="space-y-1.5">
                          {aiAnalysis.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                          <AlertCircle size={12} /> 注意点
                        </p>
                        <ul className="space-y-1.5">
                          {aiAnalysis.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <ChevronRight size={14} className="text-red-400 shrink-0 mt-0.5" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommended Scenes */}
                    <div>
                      <p className="text-xs font-semibold text-indigo-400 mb-2">推奨利用シーン</p>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.recommendedScenes.map((scene, i) => (
                          <span key={i} className="text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full">
                            {scene}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Confidentiality note */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1">
                        <Shield size={12} /> 機密性に関する評価
                      </p>
                      <p className="text-sm text-slate-300">{aiAnalysis.confidentialityNote}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Access Guide */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Navigation size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-slate-900">AI 周辺アクセスガイド</h2>
                    <p className="text-xs text-slate-400">Powered by Gemini AI</p>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mb-6">
                  最寄り駅の具体的な出口、タクシー・ハイヤー利用のアドバイスをAIが提供します。
                </p>

                {/* Basic info always visible */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Train size={12} />
                      最寄り駅
                    </div>
                    <p className="font-medium text-slate-800 text-sm">{restaurant.nearestStation}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Car size={12} />
                      タクシー
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-sm ${i < restaurant.taxiEase ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Car size={12} />
                      駐車場
                    </div>
                    <p className="font-medium text-slate-800 text-sm">
                      {restaurant.parkingAvailable ? '利用可能' : 'なし（近隣パーキング利用）'}
                    </p>
                  </div>
                </div>

                {!aiAccess && !loadingAccess && (
                  <button
                    onClick={handleAccessGuide}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-all cursor-pointer"
                  >
                    <Navigation size={16} />
                    AI アクセスガイドを生成する
                  </button>
                )}

                {loadingAccess && (
                  <div className="flex flex-col items-center py-6 gap-3">
                    <Loader2 size={28} className="text-emerald-500 animate-spin" />
                    <p className="text-slate-400 text-sm">アクセス情報を取得中...</p>
                  </div>
                )}

                {accessError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">{accessError}</p>
                  </div>
                )}

                {aiAccess && (
                  <div className="space-y-4">
                    {/* Stations */}
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Train size={14} className="text-indigo-500" />
                        最寄り駅アクセス
                      </p>
                      <div className="space-y-2">
                        {aiAccess.nearestStations.map((station, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-800 text-sm">{station.name}</span>
                              <span className="text-xs text-indigo-600 font-medium">徒歩約{station.walkTime}分</span>
                            </div>
                            <p className="text-xs text-slate-500">{station.line} · {station.exit}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Taxi advice */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <Car size={12} />
                        タクシー・ハイヤー利用
                      </p>
                      <p className="text-sm text-amber-800">{aiAccess.taxiAdvice}</p>
                    </div>

                    {/* Driver instruction */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 mb-2">運転手への案内例</p>
                      <p className="text-sm text-white font-mono leading-relaxed">「{aiAccess.driverInstruction}」</p>
                    </div>

                    {aiAccess.accessNote && (
                      <div className="text-sm text-slate-500 flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-slate-400" />
                        {aiAccess.accessNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Store Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-serif text-xl font-semibold text-slate-900 mb-4">基本情報</h2>
              <dl className="space-y-3 text-sm">
                {[
                  { dt: '住所', dd: restaurant.address },
                  { dt: '電話', dd: restaurant.tel },
                  { dt: '営業時間', dd: restaurant.openHours },
                  { dt: '定休日', dd: restaurant.closedDays },
                  { dt: 'コース', dd: restaurant.courseType },
                  { dt: '個室詳細', dd: restaurant.privateRoomDetail },
                  { dt: '要予約', dd: restaurant.reservationRequired ? 'はい' : 'いいえ' },
                  { dt: '飲み放題', dd: restaurant.drinkAllInclusive ? 'あり' : 'なし' },
                  { dt: '支払い方法', dd: restaurant.paymentMethods?.join('、') ?? '情報なし' },
                ].map((item) => (
                  <div key={item.dt} className="flex gap-4">
                    <dt className="w-24 shrink-0 text-slate-400 font-medium">{item.dt}</dt>
                    <dd className="text-slate-700">{item.dd}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Star size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">まだ口コミがありません</p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="mt-3 text-indigo-500 text-sm hover:underline cursor-pointer"
                >
                  最初の口コミを書く
                </button>
              </div>
            )}
          </div>
        )}

        {/* Write Review Tab */}
        {activeTab === 'write' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            {formSubmitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-slate-900 mb-2">
                  口コミを投稿しました
                </h3>
                <p className="text-slate-500 mb-6">ビジネス会食コミュニティへの貢献ありがとうございます。</p>
                <button
                  onClick={() => { setFormSubmitted(false); setActiveTab('reviews'); }}
                  className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-colors cursor-pointer"
                >
                  口コミ一覧を見る
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <h2 className="font-serif text-2xl font-semibold text-slate-900">口コミを投稿する</h2>
                <p className="text-slate-500 text-sm">ビジネス利用の観点での評価を共有してください。</p>

                {/* Author info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">お名前（必須）</label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('お名前を入力してください')}
                      onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                      placeholder="田中 太郎"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">役職・立場</label>
                    <input
                      type="text"
                      value={formData.authorRole}
                      onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                      placeholder="上場企業 営業部長"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                {/* Overall rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">総合評価（必須）</label>
                  <StarRating value={formData.rating} onChange={(v) => setFormData({ ...formData, rating: v })} size={28} />
                </div>

                {/* Business specs ratings */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">ビジネス特化評価</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'serviceQuality', label: '接客の洗練さ' },
                      { key: 'quietness', label: '静かさ・話しやすさ' },
                      { key: 'accessEase', label: 'アクセスのしやすさ' },
                      { key: 'confidentiality', label: '機密性（個室の防音等）' },
                      { key: 'ambiance', label: '雰囲気・格式の高さ' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <StarRating
                          value={formData[item.key as keyof typeof formData] as number}
                          onChange={(v) => setFormData({ ...formData, [item.key]: v })}
                          size={20}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">利用シーン</label>
                  <input
                    type="text"
                    value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    placeholder="例: 取締役会の前夜晩餐、海外クライアントとの接待..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">口コミ本文（必須）</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    onInvalid={(e) => (e.target as HTMLTextAreaElement).setCustomValidity('口コミ本文を入力してください')}
                    onInput={(e) => (e.target as HTMLTextAreaElement).setCustomValidity('')}
                    placeholder="接待での体験を具体的にお聞かせください。スタッフの対応、雰囲気、会食の成果なども含めていただけると他のユーザーの参考になります。"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                {/* Private room detail */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">個室に関する詳細</label>
                  <textarea
                    rows={3}
                    value={formData.privateRoomDetail}
                    onChange={(e) => setFormData({ ...formData, privateRoomDetail: e.target.value })}
                    placeholder="個室の広さ、防音性能、声の漏れやすさ、視線の遮蔽など、詳しく教えてください。"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">お一人様のお支払い金額</label>
                  <input
                    type="text"
                    value={formData.priceSpent}
                    onChange={(e) => setFormData({ ...formData, priceSpent: e.target.value })}
                    placeholder="例: ¥35,000"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Send size={16} />
                  口コミを投稿する
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

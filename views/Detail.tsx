
import React, { useEffect, useState, useRef } from 'react';
import { mockRestaurants, mockReviews } from '../data/mockData';
import { analyzeRestaurantForBusiness, getNearbyInfo } from '../services/geminiService';
import { BusinessAnalysis, Restaurant, Review, NearbyInfo, PrivateRoomType, CourseType } from '../types';

interface DetailProps {
  id: string;
  onNavigate: (path: string, params?: any) => void;
  allRestaurants: Restaurant[];
}

const Detail: React.FC<DetailProps> = ({ id, onNavigate, allRestaurants }) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analysis, setAnalysis] = useState<BusinessAnalysis | null>(null);
  const [nearbyInfo, setNearbyInfo] = useState<NearbyInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGettingNearby, setIsGettingNearby] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [form, setForm] = useState({
    rating: 5,
    tasteRating: 5,
    serviceQuality: 5,
    quietness: 5,
    privateRoomType: '完全個室' as PrivateRoomType,
    privateRoomDetail: '',
    priceSpent: '',
    courseType: '料理コース＋飲み放題付き' as CourseType,
    comment: ''
  });

  useEffect(() => {
    const res = allRestaurants.find(r => r.id === id);
    if (res) {
      setRestaurant(res);
      const resReviews = mockReviews.filter(rv => rv.restaurantId === id);
      setReviews(resReviews);
    }
  }, [id, allRestaurants]);

  const handleRunAnalysis = async () => {
    if (!restaurant) return;
    setIsAnalyzing(true);
    const result = await analyzeRestaurantForBusiness(restaurant.name, reviews);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleGetNearbyInfo = async () => {
    if (!restaurant) return;
    setIsGettingNearby(true);
    const result = await getNearbyInfo(restaurant.name, restaurant.address);
    setNearbyInfo(result);
    setIsGettingNearby(false);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const newRev: Review = {
      ...form,
      id: `rev-${Date.now()}`,
      restaurantId: id,
      userName: 'ゲストエグゼクティブ',
      userTitle: '会社役員',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setReviews([newRev, ...reviews]);
    setShowReviewForm(false);
    alert('口コミを投稿しました。貴重な情報をありがとうございます。');
  };

  if (!restaurant) return <div className="p-20 text-center text-slate-400 font-bold">情報を読み込んでいます...</div>;

  const RatingStars = ({ val, label }: { val: number; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <div className="flex text-yellow-400 text-[10px] space-x-0.5">
        {[...Array(5)].map((_, i) => <i key={i} className={`fas fa-star ${i < val ? '' : 'text-slate-100'}`}></i>)}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Photo Gallery Header */}
      <div className="h-[450px] flex overflow-hidden">
        <div className="w-3/4 h-full relative group overflow-hidden">
          <img src={restaurant.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={restaurant.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="w-1/4 flex flex-col">
          <div className="h-1/2 overflow-hidden border-l border-b border-white">
            <img src="https://picsum.photos/id/42/800/600" className="w-full h-full object-cover hover:scale-110 transition-transform" />
          </div>
          <div className="h-1/2 overflow-hidden border-l border-white">
            <img src="https://picsum.photos/id/43/800/600" className="w-full h-full object-cover hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Info */}
          <div className="lg:w-2/3">
            <div className="mb-12">
              <div className="flex items-center space-x-4 mb-6">
                <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">{restaurant.genre}</span>
                <span className="text-slate-400 text-sm font-bold">{restaurant.region} / {restaurant.area}</span>
              </div>
              <h1 className="text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight">{restaurant.name}</h1>
              
              {/* Access Summary */}
              <div className="flex items-center text-slate-500 mb-8 bg-white w-fit px-4 py-2 rounded-full border border-slate-100 text-sm font-bold">
                <i className="fas fa-train mr-2 text-indigo-500"></i>
                {restaurant.accessInfo}
              </div>

              <p className="text-xl text-slate-600 leading-relaxed mb-12 border-l-4 border-slate-100 pl-8">{restaurant.description}</p>

              {/* Business Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-slate-900 transition-colors">
                  <i className="fas fa-door-closed text-2xl text-slate-300 mb-3 group-hover:text-slate-900"></i>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">個室</span>
                  <span className="text-slate-900 font-bold">{restaurant.privateRoomType}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-slate-900 transition-colors">
                  <i className="fas fa-utensils text-2xl text-slate-300 mb-3 group-hover:text-slate-900"></i>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">提供形態</span>
                  <span className="text-slate-900 font-bold text-xs">{restaurant.courseType}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-slate-900 transition-colors">
                  <i className="fas fa-wine-glass-alt text-2xl text-slate-300 mb-3 group-hover:text-slate-900"></i>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">予算目安</span>
                  <span className="text-slate-900 font-bold text-xs">{restaurant.priceRange}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-slate-900 transition-colors">
                  <i className="fas fa-star text-2xl text-yellow-400 mb-3"></i>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">満足度</span>
                  <span className="text-slate-900 font-bold">{restaurant.avgRating}</span>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="bg-slate-900 rounded-[40px] p-12 text-white mb-16 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000"><i className="fas fa-brain text-9xl"></i></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-8">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
                      <i className="fas fa-sparkles text-white"></i>
                    </div>
                    <h3 className="text-2xl font-bold">AIビジネス・コンシェルジュ診断</h3>
                  </div>
                  {!analysis ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400 mb-8 max-w-md mx-auto">実際の利用者の声をAIが統合的に分析。接待・会食における「本当の価値」を可視化します。</p>
                      <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-slate-100 transition-all flex items-center mx-auto shadow-xl">
                        {isAnalyzing ? <><i className="fas fa-spinner fa-spin mr-3"></i> 診断中...</> : <><i className="fas fa-magic mr-3 text-indigo-500"></i> AI診断を開始</>}
                      </button>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-700">
                      <div className="flex items-end space-x-6 mb-8">
                        <div className="text-7xl font-serif text-yellow-400">{analysis.suitabilityScore}</div>
                        <div className="text-slate-400 text-sm pb-2 uppercase tracking-widest font-bold">Business Fitness Score</div>
                      </div>
                      <p className="text-xl text-slate-200 italic mb-10 leading-relaxed font-medium">"{analysis.reasoning}"</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="bg-slate-800/50 p-8 rounded-3xl">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">主な評価ポイント</h4>
                          <div className="space-y-4">
                            {analysis.pros.map((p, i) => <div key={i} className="flex items-start text-sm"><i className="fas fa-check-circle text-emerald-400 mr-3 mt-1"></i> <span>{p}</span></div>)}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 p-8 rounded-3xl">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">推奨利用シーン</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.bestUseCases.map((u, i) => <span key={i} className="bg-slate-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase">{u}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="space-y-12">
                <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                  <h3 className="text-3xl font-serif font-bold text-slate-900">ビジネスマンの評価</h3>
                  <button onClick={() => setShowReviewForm(true)} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all">口コミを投稿する</button>
                </div>

                {reviews.map(rev => (
                  <div key={rev.id} className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100"><i className="fas fa-user text-xl"></i></div>
                        <div>
                          <div className="font-bold text-slate-900 text-lg">{rev.userName}</div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{rev.userTitle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex text-yellow-400 mb-2 text-sm">{[...Array(5)].map((_, i) => <i key={i} className={`fas fa-star ${i < rev.rating ? '' : 'text-slate-100'}`}></i>)}</div>
                        <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{rev.createdAt}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                          <RatingStars label="味の質" val={rev.tasteRating} />
                          <RatingStars label="接客の洗練" val={rev.serviceQuality} />
                          <RatingStars label="店内の静粛性" val={rev.quietness} />
                          <div className="pt-4 border-t border-slate-200 space-y-3">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>利用個室</span>
                              <span className="text-slate-900 uppercase tracking-widest">{rev.privateRoomType}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>利用プラン</span>
                              <span className="text-slate-900 uppercase tracking-widest">{rev.courseType}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>実費目安</span>
                              <span className="text-slate-900 uppercase tracking-widest">{rev.priceSpent}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-slate-700 leading-relaxed font-medium text-lg mb-6">"{rev.comment}"</p>
                        {rev.privateRoomDetail && (
                          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <h5 className="text-[10px] font-bold text-emerald-800 uppercase mb-2">個室の評価詳細</h5>
                            <p className="text-sm text-emerald-900 leading-relaxed italic">"{rev.privateRoomDetail}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 space-y-10">
              {/* Maps & Access */}
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                <h4 className="font-bold text-slate-900 mb-8 flex items-center text-lg"><i className="fas fa-map-marked-alt mr-3 text-slate-300"></i> アクセス</h4>
                
                <div className="aspect-video bg-slate-50 rounded-3xl mb-8 overflow-hidden relative group">
                  <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover grayscale opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address + " " + restaurant.name)}`} target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm shadow-2xl hover:scale-105 transition-transform flex items-center">
                      <i className="fab fa-google mr-2"></i> マップで開く
                    </a>
                  </div>
                </div>

                <div className="space-y-6 mb-10 text-sm">
                  <div className="flex items-start"><i className="fas fa-map-marker-alt w-6 text-indigo-500 pt-1"></i><span className="text-slate-600 font-bold leading-relaxed">{restaurant.address}</span></div>
                  <div className="flex items-center"><i className="fas fa-phone w-6 text-slate-300"></i><span className="text-slate-600 font-bold">092-XXX-XXXX</span></div>
                </div>

                {/* AI Nearby Guide */}
                <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center"><i className="fas fa-location-arrow mr-2"></i> 周辺ガイド (AI)</span>
                    {!nearbyInfo && <button onClick={handleGetNearbyInfo} disabled={isGettingNearby} className="text-[10px] font-bold text-indigo-600 underline">{isGettingNearby ? '読込中...' : '最寄り駅情報を取得'}</button>}
                  </div>
                  {nearbyInfo ? (
                    <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                      <p className="text-xs text-indigo-900 font-bold bg-white px-4 py-2 rounded-lg border border-indigo-100 inline-block shadow-sm">{nearbyInfo.stationInfo}</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">{nearbyInfo.text}</p>
                      <div className="flex flex-wrap gap-2">
                        {nearbyInfo.links.map((l, i) => <a key={i} href={l.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors">#{l.title}</a>)}
                      </div>
                    </div>
                  ) : <p className="text-[10px] text-slate-400 italic">最寄り駅の出口や徒歩分数をAIが自動取得します。</p>}
                </div>
              </div>

              {/* Action Card */}
              <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><i className="fas fa-check-circle text-8xl"></i></div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Reservation</h4>
                  <div className="text-3xl font-serif font-bold mb-10">{restaurant.priceRange}</div>
                  <button className="w-full bg-white text-slate-900 py-5 rounded-2xl font-bold mb-4 hover:bg-slate-100 transition-all shadow-xl">今すぐ空席を確認</button>
                  <button className="w-full border-2 border-slate-700 text-slate-400 py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                    <i className="far fa-bookmark mr-2"></i> お気に入り
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-3xl font-serif font-bold text-slate-900">ビジネス体験を投稿</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-bold">Refine your business dinner review</p>
              </div>
              <button onClick={() => setShowReviewForm(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <form onSubmit={handleSubmitReview} className="p-12 overflow-y-auto space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">レーティング</h4>
                  {[
                    { label: '総合満足度', key: 'rating' },
                    { label: '料理の味', key: 'tasteRating' },
                    { label: '接客の洗練さ', key: 'serviceQuality' },
                    { label: '店内の静かさ', key: 'quietness' },
                  ].map(r => (
                    <div key={r.key} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{r.label}</span>
                      <div className="flex space-x-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" onClick={() => setForm({ ...form, [r.key]: s })} className={`text-xl transition-colors ${(form as any)[r.key] >= s ? 'text-yellow-400' : 'text-slate-100'}`}><i className="fas fa-star"></i></button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-8">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">利用状況</h4>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">支払金額 (1人あたり)</label>
                    <input type="text" value={form.priceSpent} onChange={e => setForm({ ...form, priceSpent: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-slate-900 outline-none" placeholder="¥25,000" required />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">個室形式</label>
                    <div className="flex flex-wrap gap-2">
                      {['完全個室', '半個室', 'なし'].map(t => (
                        <button key={t} type="button" onClick={() => setForm({ ...form, privateRoomType: t as PrivateRoomType })} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${form.privateRoomType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">具体的な内容</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">個室の評価 (機密性、広さ等)</label>
                    <input type="text" value={form.privateRoomDetail} onChange={e => setForm({ ...form, privateRoomDetail: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-slate-900 outline-none" placeholder="例: 隣の席の声が全く聞こえず、重要機密を伴う会談に最適だった。" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">自由コメント</label>
                    <textarea rows={5} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-6 py-6 text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none" placeholder="接客の間隔や、タクシーの手配のスムーズさ、ビジネスマンへの配慮など" required />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex space-x-6">
                <button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 py-5 border border-slate-100 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">キャンセル</button>
                <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">口コミを公開する</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;

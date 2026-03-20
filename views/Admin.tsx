
import React, { useState } from 'react';
import { Area, Region, Genre, Restaurant, PrivateRoomType, CourseType } from '../types';

interface AdminProps {
  onAddRestaurant: (restaurant: Restaurant) => void;
  onNavigate: (path: string) => void;
}

const Admin: React.FC<AdminProps> = ({ onAddRestaurant, onNavigate }) => {
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    name: '',
    genre: '日本料理',
    region: '関東',
    area: '東京',
    address: '',
    accessInfo: '',
    description: '',
    image: '',
    priceRange: '¥20,000 - ¥30,000',
    privateRoomType: '完全個室',
    courseType: '料理コース＋飲み放題付き',
    bookingEase: 3,
    serviceQuality: 5,
    tasteRating: 5,
    quietness: 4,
    avgRating: 4.5,
    reviewCount: 0
  });

  const regions: Region[] = ['関東', '関西', '九州', '中部', '北海道・東北', '中国・四国'];
  const areasByRegion: Record<Region, Area[]> = {
    '関東': ['東京', '横浜'],
    '関西': ['大阪', '京都'],
    '九州': ['福岡'],
    '中部': ['名古屋'],
    '北海道・東北': ['札幌', '仙台'],
    '中国・四国': ['広島']
  };
  const genres: Genre[] = ['日本料理', '寿司', 'イタリアン', 'フレンチ', '中華', '焼肉', 'ステーキ', '居酒屋', 'バー'];
  
  const privateRoomOptions: PrivateRoomType[] = ['完全個室', '半個室', 'なし'];
  const courseOptions: CourseType[] = ['料理コースのみ', '料理コース＋飲み放題付き', '飲み放題のみ', 'アラカルトのみ'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRestaurant: Restaurant = {
      ...formData as Restaurant,
      id: `res-${Date.now()}`
    };
    onAddRestaurant(newRestaurant);
    alert('店舗情報を登録しました。');
    onNavigate('search');
  };

  const handleRegionChange = (r: Region) => {
    setFormData({ ...formData, region: r, area: areasByRegion[r][0] });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif font-bold text-slate-900 mb-4">店舗登録</h1>
        <p className="text-slate-500 text-lg uppercase tracking-widest text-xs font-bold">Restaurant Registration</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-50 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">基本情報</h4>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">店名</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="例: 日本橋 匠" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">ジャンル</label>
              <select value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value as Genre })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm">
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">エリア選択</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">地方</label>
                <select value={formData.region} onChange={e => handleRegionChange(e.target.value as Region)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm">
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">主要都市</label>
                <select value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value as Area })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm">
                  {areasByRegion[formData.region as Region].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">住所</label>
              <input type="text" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="詳細な住所を入力" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">ビジネス・スペック詳細</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Private Room Selection */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">個室の形式</label>
              <div className="flex flex-col space-y-2">
                {privateRoomOptions.map(option => (
                  <label key={option} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${formData.privateRoomType === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    <input 
                      type="radio" 
                      name="privateRoomType" 
                      value={option} 
                      checked={formData.privateRoomType === option}
                      onChange={() => setFormData({ ...formData, privateRoomType: option })}
                      className="hidden"
                    />
                    <i className={`fas ${option === '完全個室' ? 'fa-door-closed' : option === '半個室' ? 'fa-border-none' : 'fa-times-circle'} text-sm`}></i>
                    <span className="text-sm font-bold">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">コース・提供形態</label>
              <div className="flex flex-col space-y-2">
                {courseOptions.map(option => (
                  <label key={option} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${formData.courseType === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    <input 
                      type="radio" 
                      name="courseType" 
                      value={option} 
                      checked={formData.courseType === option}
                      onChange={() => setFormData({ ...formData, courseType: option })}
                      className="hidden"
                    />
                    <i className={`fas ${option.includes('飲み放題') ? 'fa-glass-cheers' : 'fa-utensils'} text-sm`}></i>
                    <span className="text-sm font-bold">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">アクセス情報</h4>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">最寄り駅からのアクセス (自動入力可)</label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={formData.accessInfo} 
                onChange={e => setFormData({ ...formData, accessInfo: e.target.value })} 
                className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" 
                placeholder="例: 銀座駅から徒歩3分" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">店舗説明</h4>
          <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none resize-none" placeholder="接待での強みや個室の雰囲気などを詳しく" required />
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">ビジュアル</h4>
          <input type="url" required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="メイン画像URL" />
        </div>

        <div className="pt-10">
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-2xl">店舗情報を公開する</button>
        </div>
      </form>
    </div>
  );
};

export default Admin;

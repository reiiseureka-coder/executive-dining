
import { Restaurant, Review } from '../types';

export const mockRestaurants: Restaurant[] = [
  {
    id: 'res-tokyo-1',
    name: '銀座 鮨 かねさか',
    genre: '寿司',
    region: '関東',
    area: '東京',
    address: '東京都中央区銀座8-10-3',
    description: '銀座の伝統を守り続ける名店。静謐な空間で、重要顧客との信頼関係を築くのに最適です。',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.9,
    priceRange: '¥30,000 - ¥50,000',
    privateRoomType: '完全個室',
    courseType: '料理コースのみ',
    accessInfo: '銀座駅から徒歩5分',
    bookingEase: 2,
    serviceQuality: 5,
    tasteRating: 5,
    quietness: 5,
    reviewCount: 42
  },
  {
    id: 'res-osaka-1',
    name: '北新地 弧柳',
    genre: '日本料理',
    region: '関西',
    area: '大阪',
    address: '大阪府大阪市北区堂島1-5-1',
    description: '浪速の食文化を現代的に昇華。個室完備で、落ち着いた商談が可能です。',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.8,
    priceRange: '¥20,000 - ¥30,000',
    privateRoomType: '完全個室',
    courseType: '料理コースのみ',
    accessInfo: '北新地駅から徒歩3分',
    bookingEase: 3,
    serviceQuality: 5,
    tasteRating: 5,
    quietness: 4,
    reviewCount: 38
  },
  {
    id: 'res-fukuoka-1',
    name: '博多 割烹よし田',
    genre: '日本料理',
    region: '九州',
    area: '福岡',
    address: '福岡県福岡市博多区博多駅前2-8-15',
    description: '伝統的な博多の味を大切にした老舗。イカの活き造りは遠方からのお客様への接待に必須。',
    image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.8,
    priceRange: '¥15,000 - ¥20,000',
    privateRoomType: '完全個室',
    courseType: '料理コース＋飲み放題付き',
    accessInfo: '博多駅から徒歩4分',
    bookingEase: 3,
    serviceQuality: 5,
    tasteRating: 5,
    quietness: 4,
    reviewCount: 124
  }
];

export const mockReviews: Review[] = [
  {
    id: 'rev-1',
    restaurantId: 'res-fukuoka-1',
    userName: '佐藤 健太',
    userTitle: 'IT企業 執行役員',
    rating: 5,
    serviceQuality: 5,
    tasteRating: 5,
    quietness: 4,
    privateRoomType: '完全個室',
    privateRoomDetail: '掘りごたつ式の完全個室。防音がしっかりしており機密性の高い話も可能。',
    priceSpent: '¥18,500',
    courseType: '料理コース＋飲み放題付き',
    comment: '女将さんの立ち居振る舞いが素晴らしく、お客様を安心してお任せできました。博多ならではの料理に、東京からのお客様も大満足でした。',
    createdAt: '2024-03-20'
  }
];

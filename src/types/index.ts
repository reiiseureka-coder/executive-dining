export interface BusinessSpecs {
  serviceQuality: number;   // 接客の洗練さ (1-5)
  quietness: number;        // 静かさ (1-5)
  accessEase: number;       // アクセス (1-5)
  confidentiality: number;  // 機密性 (1-5)
  ambiance: number;         // 雰囲気・格式 (1-5)
}

export interface Restaurant {
  id: string;
  name: string;
  nameEn: string;
  genre: string;
  region: '関東' | '関西' | '東海' | '九州' | '北海道・東北' | '中国・四国';
  area: string;
  address: string;
  nearestStation: string;
  privateRoomType: '完全個室' | '半個室' | '部屋個室' | 'なし';
  privateRoomDetail: string;
  courseType: string;
  priceRange: string;
  avgPricePerPerson: number;
  avgRating: number;
  reviewCount: number;
  businessSpecs: BusinessSpecs;
  overallBusinessScore: number; // 1-100
  serviceLevel: number;         // 接客レベル ⭐️ 1-5
  drinkAllInclusive: boolean;   // 飲み放題
  paymentMethods: string[];     // 支払い方法
  tags: string[];
  imageUrl: string;
  description: string;
  recommendedFor: string[];
  tel: string;
  openHours: string;
  closedDays: string;
  capacity: number;
  privateRoomCapacity: string;
  parkingAvailable: boolean;
  taxiEase: number; // タクシーの捕まえやすさ (1-5)
  dressCode: string;
  reservationStatus: '可能' | '不可能' | '要予約';
  reservationUrl?: string;
  smokingPolicy: '喫煙可' | '喫煙室あり' | '禁煙';
  createdAt: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  author: string;
  authorRole: string;
  date: string;
  rating: number;
  serviceQuality: number;
  quietness: number;
  accessEase: number;
  confidentiality: number;
  ambiance: number;
  comment: string;
  privateRoomDetail: string;
  priceSpent: string;
  occasion: string;
  wouldRecommend: boolean;
  helpfulCount: number;
}

export interface AIAnalysis {
  businessScore: number;
  summary: string;
  pros: string[];
  cons: string[];
  recommendedScenes: string[];
  confidentialityNote: string;
  executiveSuitability: '最適' | '適切' | '条件付き' | '不適';
}

export interface AIAccessGuide {
  nearestStations: { name: string; line: string; exit: string; walkTime: number }[];
  taxiAdvice: string;
  driverInstruction: string;
  accessNote: string;
}

// ユーザーランク
export type UserRank = 'ブロンズ' | 'シルバー' | 'ゴールド' | 'ルビー';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  rank: UserRank;
  createdAt: string;
}

export type Page = 'restaurants' | 'corporate' | 'home' | 'search' | 'detail' | 'admin' | 'about' | 'nagoya' | 'curation' | 'demo' | 'nagoya-detail' | 'compare' | 'membership' | 'pilot';

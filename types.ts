
export type Region = '関東' | '関西' | '九州' | '中部' | '北海道・東北' | '中国・四国';

export type Area = '東京' | '横浜' | '大阪' | '京都' | '福岡' | '名古屋' | '札幌' | '広島' | '仙台';

export type Genre = '日本料理' | '寿司' | 'イタリアン' | 'フレンチ' | '中華' | '焼肉' | 'ステーキ' | '居酒屋' | 'バー';

export type PrivateRoomType = '完全個室' | '半個室' | 'なし';

export type CourseType = '料理コースのみ' | '料理コース＋飲み放題付き' | '飲み放題のみ' | 'アラカルトのみ';

export interface Restaurant {
  id: string;
  name: string;
  genre: Genre;
  region: Region;
  area: Area;
  address: string;
  description: string;
  image: string;
  avgRating: number;
  priceRange: string;
  privateRoomType: PrivateRoomType;
  courseType: CourseType;
  accessInfo: string; // "銀座駅から徒歩3分" 等
  bookingEase: number; // 1-5
  serviceQuality: number; // 1-5
  tasteRating: number; // 1-5
  quietness: number; // 1-5
  reviewCount: number;
  lat?: number;
  lng?: number;
}

export interface Review {
  id: string;
  restaurantId: string;
  userName: string;
  userTitle: string;
  rating: number; // Overall
  serviceQuality: number; // 接客
  tasteRating: number; // 味
  quietness: number; // 静かさ
  privateRoomType: PrivateRoomType; // 利用した個室タイプ
  privateRoomDetail: string;
  priceSpent: string; // 実際に支払った金額
  courseType: CourseType; // 利用したコースタイプ
  comment: string;
  createdAt: string;
  photos?: {
    meal?: string[];
    ambiance?: string[];
  };
}

export interface BusinessAnalysis {
  suitabilityScore: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  bestUseCases: string[];
}

export interface NearbyInfo {
  text: string;
  stationInfo: string;
  links: { title: string; uri: string }[];
}

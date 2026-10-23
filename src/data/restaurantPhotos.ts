/** Rights-approved venue photography is intentionally separate from UI illustrations. */
export interface RestaurantPhoto {
  kind: 'restaurant-photo';
  id: string;
  restaurantId: string;
  src: `/images/${string}`;
  width: number;
  height: number;
  alt: string;
  caption: string;
  rights: {
    status: 'approved';
    rightsHolder: string;
    sourceUrl: string;
    permissionEvidence: string;
    approvedAt: string;
    displayScope: 'card-detail-modal';
    attribution: string;
    licenseName?: string;
    licenseUrl?: string;
  };
}

/** No venue photograph has confirmed republication rights. Do not populate from links alone. */
export const restaurantPhotos: readonly RestaurantPhoto[] = [];

export const ILLUSTRATION_DISCLAIMER = '実店舗の写真ではないイメージ画像';

export interface DiningIllustration {
  kind: 'illustration';
  id: string;
  source: 'generated-ui-illustration';
  generatedAt: '2026-10-09';
  category: 'japanese-cuisine' | 'chinese-cuisine' | 'neutral-table';
  src: `/images/${string}`;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export type RestaurantVisual = RestaurantPhoto | DiningIllustration;

/** Fictional, locally hosted assets, not evidence of any restaurant, menu or room. */
export const generatedIllustrations = {
  japanese: {
    kind: 'illustration', id: 'illustration-japanese', source: 'generated-ui-illustration',
    generatedAt: '2026-10-09', category: 'japanese-cuisine',
    src: '/images/dining-japanese.webp', width: 1200, height: 800,
    alt: `架空の和食の食卓。生成 / UI確認用。${ILLUSTRATION_DISCLAIMER}`,
    caption: '架空の和食の食卓',
  },
  chinese: {
    kind: 'illustration', id: 'illustration-chinese', source: 'generated-ui-illustration',
    generatedAt: '2026-10-09', category: 'chinese-cuisine',
    src: '/images/dining-chinese.webp', width: 1200, height: 800,
    alt: `架空の中国料理の食卓。生成 / UI確認用。${ILLUSTRATION_DISCLAIMER}`,
    caption: '架空の中国料理の食卓',
  },
  table: {
    kind: 'illustration', id: 'illustration-neutral-table', source: 'generated-ui-illustration',
    generatedAt: '2026-10-09', category: 'neutral-table',
    src: '/images/dining-room.webp', width: 1200, height: 800,
    alt: `架空のテーブル。店舗の内観や個室を示すものではありません。生成 / UI確認用。${ILLUSTRATION_DISCLAIMER}`,
    caption: '架空のテーブル（店舗の内観・個室ではありません）',
  },
} as const satisfies Record<string, DiningIllustration>;

/** Venue ID selects approved photography only; illustration selection uses genre, never name hashing. */
export function getRestaurantGallery(restaurantId: string, genre = ''): readonly RestaurantVisual[] {
  const approved = restaurantPhotos.filter(photo => photo.restaurantId === restaurantId
    && photo.rights.status === 'approved' && photo.rights.displayScope === 'card-detail-modal');
  if (approved.length) return approved;
  if (/中華|中国|広東|四川|上海|北京|チャイニーズ/u.test(genre)) {
    return [generatedIllustrations.chinese, generatedIllustrations.table];
  }
  if (/和食|日本料理|懐石|会席|加賀|寿司|鮨/u.test(genre)) {
    return [generatedIllustrations.japanese, generatedIllustrations.table];
  }
  // An unknown cuisine must not be presented as a Japanese/Chinese meal.
  return [generatedIllustrations.table];
}

/** Official pages checked 2026-10-23. Linking does not grant image republication rights. */
export const officialRestaurantGalleries: Readonly<Record<string, string>> = {
  'e5329b58-55e3-4cc7-aee5-3940483ecced': 'https://www.nagoyakankohotel.co.jp/restaurant_bars/ryujo/',
  '6c713786-d51a-4b58-a265-b326790d848e': 'https://nagoya.hiltonjapan.co.jp/restaurants/ouchou/gallery',
  '2fab79a8-ecc5-4c3d-a5c7-205e0d0ce9ee': 'https://kyoto-kitcho.com/en/restaurant/nagoya/',
  'dfbe14a7-06e0-4faf-ae35-7114cbe2c7b4': 'https://nangokusyuka.co.jp/store/nagoya.html',
  'c7c41cd3-a416-4660-acfb-5153ead6798c': 'https://www.nadaman.co.jp/pages/restaurant_nagoya_table_japanese-rooms',
  '1c3c96bd-3e94-4b70-a020-053efa2edfca': 'https://www.asadayaihei.co.jp/nagoya/room/',
  '60e904be-e8e2-4016-ab51-6730cc75250f': 'https://www.nadaman.co.jp/pages/restaurant_meieki_table_dining-room',
  'cf0fade4-6d0b-40f7-aa5a-a2db1593441f': 'https://www.kagaya.co.jp/shoku/shop/nagoya.php',
  '092957f9-0df1-4431-afbf-2c32cb5582fd': 'https://www.nagoyakankohotel.co.jp/restaurant_bars/kuretake/',
  '29bbe29a-c6d3-4694-a893-0ad8e48ddf0c': 'https://nagoya.hiltonjapan.co.jp/restaurants/genji_kaiseki/gallery',
};

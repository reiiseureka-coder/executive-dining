-- ==========================================
-- Executive Dining - Supabase テーブル定義
-- SQL Editor で実行してください
-- ==========================================

-- 1. レストランテーブル
create table if not exists restaurants (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  name_en               text,
  genre                 text not null,
  region                text not null,
  area                  text not null,
  address               text not null,
  nearest_station       text not null,
  private_room_type     text not null check (private_room_type in ('完全個室','半個室','部屋個室','なし')),
  private_room_detail   text,
  course_type           text,
  price_range           text,
  avg_price_per_person  integer default 0,
  avg_rating            numeric(3,2) default 0,
  review_count          integer default 0,
  business_specs        jsonb not null default '{"serviceQuality":3,"quietness":3,"accessEase":3,"confidentiality":3,"ambiance":3}',
  overall_business_score integer default 0,
  service_level         integer default 3 check (service_level between 1 and 5),
  drink_all_inclusive   boolean default false,
  payment_methods       text[] default '{}',
  tags                  text[] default '{}',
  image_url             text,
  description           text,
  recommended_for       text[] default '{}',
  tel                   text,
  open_hours            text,
  closed_days           text,
  capacity              integer default 0,
  private_room_capacity text,
  parking_available     boolean default false,
  taxi_ease             integer default 3 check (taxi_ease between 1 and 5),
  dress_code            text,
  reservation_required  boolean default true,
  created_at            timestamptz default now()
);

-- 2. ユーザープロフィールテーブル
create table if not exists user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text not null,
  avatar_url   text,
  rank         text not null default 'ブロンズ' check (rank in ('ブロンズ','シルバー','ゴールド','ルビー')),
  created_at   timestamptz default now()
);

-- 3. 口コミテーブル
create table if not exists reviews (
  id                  uuid primary key default gen_random_uuid(),
  restaurant_id       uuid references restaurants(id) on delete cascade,
  author_id           uuid references auth.users(id) on delete set null,
  author              text not null,
  author_role         text,
  rating              integer not null check (rating between 1 and 5),
  service_quality     integer check (service_quality between 1 and 5),
  quietness           integer check (quietness between 1 and 5),
  access_ease         integer check (access_ease between 1 and 5),
  confidentiality     integer check (confidentiality between 1 and 5),
  ambiance            integer check (ambiance between 1 and 5),
  comment             text not null,
  private_room_detail text,
  price_spent         text,
  occasion            text,
  would_recommend     boolean default true,
  helpful_count       integer default 0,
  created_at          timestamptz default now()
);

-- ==========================================
-- RLS (Row Level Security) ポリシー
-- ==========================================

-- restaurants: 誰でも読める、ログインユーザーが書ける
alter table restaurants enable row level security;
create policy "restaurants_select" on restaurants for select using (true);
create policy "restaurants_insert" on restaurants for insert with check (auth.role() = 'authenticated');

-- user_profiles: 自分のプロフィールのみ操作可能
alter table user_profiles enable row level security;
create policy "profiles_select" on user_profiles for select using (true);
create policy "profiles_insert" on user_profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on user_profiles for update using (auth.uid() = id);

-- reviews: 誰でも読める、ログインユーザーが書ける
alter table reviews enable row level security;
create policy "reviews_select" on reviews for select using (true);
create policy "reviews_insert" on reviews for insert with check (auth.role() = 'authenticated');

-- ==========================================
-- Google OAuth の有効化手順
-- ==========================================
-- Supabase ダッシュボード:
--   Authentication > Providers > Google をON
--   Google Cloud Console で OAuth 2.0 クライアントIDを取得して設定
--   Authorized redirect URI: https://mdrehacsefovcqcpprgz.supabase.co/auth/v1/callback

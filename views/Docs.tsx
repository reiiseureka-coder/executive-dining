
import React from 'react';

const Docs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in duration-500">
      <h1 className="text-4xl font-serif font-bold text-slate-900 mb-12">Executive Dining 要件定義書</h1>

      <section className="mb-16">
        <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 mb-8">1. 機能要件定義</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <i className="fas fa-desktop mr-2 text-indigo-500"></i> フロントエンド
            </h3>
            <ul className="space-y-3 text-slate-600 list-disc pl-5">
              <li>飲食店一覧表示 (エリア・ジャンル検索/フィルタ)</li>
              <li>ビジネス特化型詳細ページ (AI要約、個室詳細)</li>
              <li>口コミ投稿フォーム (5段階評価 + ビジネス項目)</li>
              <li>Google Maps連携 (店舗位置表示、経路検索)</li>
              <li>ユーザー認証 (ログイン・会員登録・マイページ)</li>
              <li>行きたいリスト (保存機能)</li>
              <li>通知機能 (予約リマインド、新規投稿)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <i className="fas fa-server mr-2 text-indigo-500"></i> バックエンド
            </h3>
            <ul className="space-y-3 text-slate-600 list-disc pl-5">
              <li>店舗・口コミデータベース管理 (CRUD)</li>
              <li>AI画像/テキスト解析 (不適切な口コミの自動検知)</li>
              <li>Google Places APIとのデータ同期</li>
              <li>Gemini API連携による口コミ要約・分析</li>
              <li>予約システム連携 API</li>
              <li>管理画面 (店舗情報の編集、口コミ承認)</li>
              <li>アクセスログ解析・検索SEO最適化</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-16 bg-slate-50 p-8 rounded-2xl">
        <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 mb-8">2. コーポレートサイト構成案</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-bold mb-3">トップページ</h4>
            <p className="text-sm text-slate-500">ミッション「成功を食卓から」の提示。主要機能の紹介。</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-bold mb-3">サービス概要</h4>
            <p className="text-sm text-slate-500">なぜExecutive Diningなのか？既存サイトとの違いを説明。</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-bold mb-3">掲載店向け案内</h4>
            <p className="text-sm text-slate-500">法人利用による送客メリット。掲載・予約管理機能の説明。</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-bold mb-3">ビジョン・想い</h4>
            <p className="text-sm text-slate-500">代表メッセージ。福岡・九州の経済活性化への寄与。</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-bold mb-3">お知らせ・ブログ</h4>
            <p className="text-sm text-slate-500">新機能追加。接待マナーやエリア特集などのオウンドメディア。</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h4 className="font-bold mb-3">お問い合わせ</h4>
            <p className="text-sm text-slate-500">掲載希望、取材依頼、一般のお問い合わせ。</p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 mb-8">3. DB (データベース) 設計案</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 font-bold text-slate-400 uppercase tracking-widest text-xs">テーブル</th>
                <th className="py-4 font-bold text-slate-400 uppercase tracking-widest text-xs">主なフィールド</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-b border-slate-100">
                <td className="py-4 font-bold">Restaurants</td>
                <td className="py-4">id, name, genre_id, area_id, address, lat, lng, main_image, avg_rating, booking_difficulty_avg</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 font-bold">Reviews</td>
                <td className="py-4">id, user_id, restaurant_id, rating, service_quality(1-5), private_room_detail(text), booking_ease(1-5), price_paid, has_nomihodai(bool), comment(text)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 font-bold">Users</td>
                <td className="py-4">id, name, company_name, position, email, profile_image, verified_badge(bool)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 font-bold">Analysis</td>
                <td className="py-4">id, restaurant_id, suitability_score, summary_text, ai_generated_date</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 mb-8">4. 技術選定</h2>
        <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="font-bold text-indigo-400 mb-4 uppercase tracking-widest">推奨スタック</h4>
              <ul className="space-y-4">
                <li>
                  <span className="font-bold block">Next.js (App Router)</span>
                  <p className="text-sm text-slate-400">高速なページ遷移とSEO対応を両立。福岡エリア特化のキーワード対策に必須。</p>
                </li>
                <li>
                  <span className="font-bold block">Firebase / Firestore</span>
                  <p className="text-sm text-slate-400">リアルタイム性のある口コミ管理に最適。小規模から大規模までスケール可能。</p>
                </li>
                <li>
                  <span className="font-bold block">Google Maps Platform API</span>
                  <p className="text-sm text-slate-400">正確な位置情報と周辺情報を取得。ビジネスマンの経路案内を支える。</p>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-indigo-400 mb-4 uppercase tracking-widest">AI & Design</h4>
              <ul className="space-y-4">
                <li>
                  <span className="font-bold block">Gemini API</span>
                  <p className="text-sm text-slate-400">口コミの要約、不適切コンテンツの検知、接待適性診断のロジック構築に活用。</p>
                </li>
                <li>
                  <span className="font-bold block">Tailwind CSS</span>
                  <p className="text-sm text-slate-400">信頼感のある「エグゼクティブ向け」の洗練されたUIを迅速に構築可能。</p>
                </li>
                <li>
                  <span className="font-bold block">Vercel</span>
                  <p className="text-sm text-slate-400">デプロイとプレビュー管理。CI/CD環境を整え、爆速での改善を可能にする。</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Docs;

import { ChevronRight } from 'lucide-react';
import type { Page } from '../types';

interface AboutProps {
  onNavigate: (page: Page) => void;
}

export default function About({ onNavigate }: AboutProps) {
  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-700">
      {/* Hero */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-slate-400 uppercase tracking-widest text-xs font-bold">About</span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mt-3 mb-6">
            サービスについて
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            「成功するビジネスは、食卓から始まる」<br />
            会食特化型口コミサイトとして、ビジネスの質を高めます。
          </p>
        </div>
      </section>

      {/* WHY Executive Dining */}
      <section className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-slate-500 uppercase tracking-widest text-sm font-bold">Why Executive Dining</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mt-2 mb-4">
              接待に特化した、唯一の評価軸
            </h2>
            <div className="w-16 h-1 bg-slate-900 mx-auto"></div>
            <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto mt-6">
              一般的なグルメサイトでは分からない、ビジネスシーンで本当に重要な情報を提供します。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔒',
                title: '機密性・個室評価',
                desc: '防音性能、視線の遮蔽、会話の漏れやすさなど、重要な商談に必要な環境を詳細に評価。完全個室かどうかだけでなく、実際の使用感を口コミで確認できます。',
              },
              {
                icon: '🤖',
                title: 'AI ビジネス診断',
                desc: 'Gemini AI が複数の口コミを統合分析。「役員接待に最適か」「機密性は保たれるか」「どんな会食シーンに向くか」を総合スコアで可視化します。',
              },
              {
                icon: '🚖',
                title: 'アクセス・帰宅動線',
                desc: '会食後のタクシーの捕まえやすさ、ハイヤー駐車スペース、最寄り駅の具体的な出口まで。スムーズな帰宅を実現する実践的な情報を提供します。',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Concept */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-slate-500 uppercase tracking-widest text-sm font-bold">Concept</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mt-2 mb-4">
              ビジネス会食の常識を変える
            </h2>
            <div className="w-16 h-1 bg-slate-900 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 leading-relaxed">
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-900 mb-3">一般グルメサイトの限界</h3>
              <p className="text-sm">
                既存のグルメサイトは「料理の美味しさ」「コスパ」「デートにおすすめ」などの評価軸が中心です。
                しかしビジネスの接待では、機密性・個室の防音・タクシーアクセス・スタッフの立ち振る舞いなど、
                まったく異なる要素が重要になります。
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-900 mb-3">Executive Diningの解決策</h3>
              <p className="text-sm">
                私たちはビジネスエグゼクティブに特化した評価軸を設計。実際に接待・商談・VIP会食を経験した
                プロフェッショナルたちのリアルな口コミと、AIによる統合分析で、
                「失敗しない店選び」を実現します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            次の会食、失敗できますか？
          </h2>
          <p className="text-slate-300 text-base md:text-lg mb-10">
            重要な商談、役員接待、海外VIPのおもてなし。<br />
            店選びのリスクを、AIの力でゼロに近づけましょう。
          </p>
          <button
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-slate-100 transition-all shadow-lg text-base md:text-lg"
          >
            今すぐ店を探す <ChevronRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}

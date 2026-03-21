import { useState } from 'react';
import { Save, Plus, CheckCircle, Building2, MapPin, Utensils, Lock, Clock, Phone, Users, Star, CreditCard } from 'lucide-react';
import type { Restaurant } from '../types';
import { supabase } from '../lib/supabase';

type FormData = Omit<Restaurant, 'id' | 'avgRating' | 'reviewCount' | 'overallBusinessScore' | 'createdAt'>;

const GENRES = ['寿司', '日本料理', '京懐石', '日本料理・創作', '鉄板焼・ステーキ', 'フレンチ', 'フレンチ・創作', 'イタリアン', '中国料理', '焼肉', 'しゃぶしゃぶ', '天ぷら', 'うなぎ', 'その他'];
const REGIONS = ['関東', '関西', '東海', '九州', '北海道・東北', '中国・四国'] as const;
const PRIVATE_ROOM_TYPES = ['完全個室', '半個室', '部屋個室', 'なし'] as const;
const PAYMENT_OPTIONS = ['現金', 'クレジットカード', 'QRコード決済', '電子マネー', '法人請求書払い', 'デビットカード'];

const INITIAL: FormData = {
  name: '',
  nameEn: '',
  genre: '寿司',
  region: '関東',
  area: '',
  address: '',
  nearestStation: '',
  privateRoomType: '完全個室',
  privateRoomDetail: '',
  courseType: '',
  priceRange: '',
  avgPricePerPerson: 0,
  businessSpecs: { serviceQuality: 3, quietness: 3, accessEase: 3, confidentiality: 3, ambiance: 3 },
  serviceLevel: 3,
  drinkAllInclusive: false,
  paymentMethods: [],
  tags: [],
  imageUrl: '',
  description: '',
  recommendedFor: [],
  tel: '',
  openHours: '',
  closedDays: '',
  capacity: 0,
  privateRoomCapacity: '',
  parkingAvailable: false,
  taxiEase: 3,
  dressCode: 'スマートカジュアル',
  reservationRequired: true,
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Icon size={18} className="text-indigo-500" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors";

const setJaValidity = (e: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement>, msg = 'この項目は必須です') => {
  e.currentTarget.setCustomValidity(msg);
};
const clearValidity = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.setCustomValidity('');
};
const selectCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors bg-white appearance-none cursor-pointer";

export default function Admin() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [sceneInput, setSceneInput] = useState('');

  const update = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateSpec = (key: keyof FormData['businessSpecs'], value: number) =>
    setForm((prev) => ({ ...prev, businessSpecs: { ...prev.businessSpecs, [key]: value } }));

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      update('tags', [...form.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => update('tags', form.tags.filter((t) => t !== tag));

  const addScene = () => {
    if (sceneInput.trim() && !form.recommendedFor.includes(sceneInput.trim())) {
      update('recommendedFor', [...form.recommendedFor, sceneInput.trim()]);
      setSceneInput('');
    }
  };

  const removeScene = (s: string) => update('recommendedFor', form.recommendedFor.filter((x) => x !== s));

  const togglePayment = (method: string) => {
    const current = form.paymentMethods;
    if (current.includes(method)) {
      update('paymentMethods', current.filter((m) => m !== method));
    } else {
      update('paymentMethods', [...current, method]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    const record = {
      name: form.name,
      name_en: form.nameEn,
      genre: form.genre,
      region: form.region,
      area: form.area,
      address: form.address,
      nearest_station: form.nearestStation,
      private_room_type: form.privateRoomType,
      private_room_detail: form.privateRoomDetail,
      course_type: form.courseType,
      price_range: form.priceRange,
      avg_price_per_person: form.avgPricePerPerson,
      avg_rating: 0,
      review_count: 0,
      business_specs: form.businessSpecs,
      overall_business_score: 0,
      service_level: form.serviceLevel,
      drink_all_inclusive: form.drinkAllInclusive,
      payment_methods: form.paymentMethods,
      tags: form.tags,
      image_url: form.imageUrl,
      description: form.description,
      recommended_for: form.recommendedFor,
      tel: form.tel,
      open_hours: form.openHours,
      closed_days: form.closedDays,
      capacity: form.capacity,
      private_room_capacity: form.privateRoomCapacity,
      parking_available: form.parkingAvailable,
      taxi_ease: form.taxiEase,
      dress_code: form.dressCode,
      reservation_required: form.reservationRequired,
    };

    const { error } = await supabase.from('restaurants').insert(record);
    setSaving(false);

    if (error) {
      setSaveError(`保存に失敗しました: ${error.message}`);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">登録が完了しました</h2>
          <p className="text-slate-500 text-sm mb-6">
            「{form.name}」を登録しました。
          </p>
          <button
            onClick={() => { setForm(INITIAL); setSubmitted(false); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            次の店舗を登録する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white">新規店舗登録</h1>
              <p className="text-slate-400 text-sm">Executive Dining プラットフォームへの掲載申請</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Section title="基本情報" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="店舗名（日本語）" required>
                <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} onInvalid={(e) => setJaValidity(e, '店舗名を入力してください')} onInput={clearValidity} placeholder="銀座 久兵衛" className={inputCls} />
              </Field>
              <Field label="店舗名（英語）">
                <input type="text" value={form.nameEn} onChange={(e) => update('nameEn', e.target.value)} placeholder="Ginza Kyubey" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="料理ジャンル" required>
                <select value={form.genre} onChange={(e) => update('genre', e.target.value)} className={selectCls}>
                  {GENRES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="価格帯（表示用）" required>
                <input type="text" required value={form.priceRange} onChange={(e) => update('priceRange', e.target.value)} onInvalid={(e) => setJaValidity(e, '価格帯を入力してください')} onInput={clearValidity} placeholder="¥20,000〜¥35,000" className={inputCls} />
              </Field>
            </div>
            <Field label="店舗説明">
              <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="店舗の特徴やビジネス利用上の強みを記入してください。" className={`${inputCls} resize-none`} />
            </Field>
          </Section>

          {/* Location */}
          <Section title="所在地・アクセス" icon={MapPin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="地方" required>
                <select value={form.region} onChange={(e) => update('region', e.target.value as typeof form.region)} className={selectCls}>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="エリア" required>
                <input type="text" required value={form.area} onChange={(e) => update('area', e.target.value)} onInvalid={(e) => setJaValidity(e, 'エリアを入力してください')} onInput={clearValidity} placeholder="銀座 / 六本木 / 梅田..." className={inputCls} />
              </Field>
            </div>
            <Field label="住所" required>
              <input type="text" required value={form.address} onChange={(e) => update('address', e.target.value)} onInvalid={(e) => setJaValidity(e, '住所を入力してください')} onInput={clearValidity} placeholder="東京都中央区銀座8-7-6" className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="最寄り駅" required>
                <input type="text" required value={form.nearestStation} onChange={(e) => update('nearestStation', e.target.value)} onInvalid={(e) => setJaValidity(e, '最寄り駅を入力してください')} onInput={clearValidity} placeholder="銀座駅" className={inputCls} />
              </Field>
              <Field label="タクシーの捕まえやすさ">
                <select value={form.taxiEase} onChange={(e) => update('taxiEase', Number(e.target.value))} className={selectCls}>
                  {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} - {['非常に悪い', '悪い', '普通', '良い', '非常に良い'][v - 1]}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="parking" checked={form.parkingAvailable} onChange={(e) => update('parkingAvailable', e.target.checked)} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
              <label htmlFor="parking" className="text-sm text-slate-700 cursor-pointer">駐車場あり</label>
            </div>
          </Section>

          {/* Private Room */}
          <Section title="個室・プライバシー" icon={Lock}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="個室タイプ" required>
                <select value={form.privateRoomType} onChange={(e) => update('privateRoomType', e.target.value as typeof form.privateRoomType)} className={selectCls}>
                  {PRIVATE_ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="個室収容人数">
                <input type="text" value={form.privateRoomCapacity} onChange={(e) => update('privateRoomCapacity', e.target.value)} placeholder="2〜8名 × 3室" className={inputCls} />
              </Field>
            </div>
            <Field label="個室の詳細説明">
              <textarea rows={3} value={form.privateRoomDetail} onChange={(e) => update('privateRoomDetail', e.target.value)} placeholder="防音性能、広さ、設備、雰囲気などを具体的に。" className={`${inputCls} resize-none`} />
            </Field>
          </Section>

          {/* Course & Reservation */}
          <Section title="コース・予約・支払い" icon={Utensils}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="コース形態">
                <input type="text" value={form.courseType} onChange={(e) => update('courseType', e.target.value)} placeholder="おまかせコース / 会席コース..." className={inputCls} />
              </Field>
              <Field label="ドレスコード">
                <select value={form.dressCode} onChange={(e) => update('dressCode', e.target.value)} className={selectCls}>
                  {['指定なし', 'スマートカジュアル', 'スマートカジュアル以上', 'スマートエレガント以上', 'フォーマル'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="総収容人数">
                <input type="number" value={form.capacity || ''} onChange={(e) => update('capacity', Number(e.target.value))} min={0} className={inputCls} />
              </Field>
              <Field label="1名あたり平均単価（円）">
                <input type="number" value={form.avgPricePerPerson || ''} onChange={(e) => update('avgPricePerPerson', Number(e.target.value))} min={0} placeholder="30000" className={inputCls} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="reservation" checked={form.reservationRequired} onChange={(e) => update('reservationRequired', e.target.checked)} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                <label htmlFor="reservation" className="text-sm text-slate-700 cursor-pointer">完全予約制</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="drink" checked={form.drinkAllInclusive} onChange={(e) => update('drinkAllInclusive', e.target.checked)} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                <label htmlFor="drink" className="text-sm text-slate-700 cursor-pointer">飲み放題プランあり</label>
              </div>
            </div>
            <Field label="支払い方法">
              <div className="flex flex-wrap gap-2 mt-1">
                {PAYMENT_OPTIONS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => togglePayment(method)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                      form.paymentMethods.includes(method)
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* Hours & Contact */}
          <Section title="営業時間・連絡先" icon={Clock}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="電話番号">
                <input type="tel" value={form.tel} onChange={(e) => update('tel', e.target.value)} placeholder="03-0000-0000" className={inputCls} />
              </Field>
              <Field label="定休日">
                <input type="text" value={form.closedDays} onChange={(e) => update('closedDays', e.target.value)} placeholder="日曜・祝日" className={inputCls} />
              </Field>
            </div>
            <Field label="営業時間">
              <input type="text" value={form.openHours} onChange={(e) => update('openHours', e.target.value)} placeholder="12:00〜14:00 / 17:30〜22:00" className={inputCls} />
            </Field>
          </Section>

          {/* Service Level */}
          <Section title="接客レベル" icon={Star}>
            <p className="text-sm text-slate-500">接客の総合レベルを⭐️で評価してください。</p>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update('serviceLevel', v)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={v <= form.serviceLevel ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-500">
                {['', '要改善', '普通', '良い', '非常に良い', '最高水準'][form.serviceLevel]}
              </span>
            </div>
          </Section>

          {/* Business Specs */}
          <Section title="ビジネス適性スペック評価" icon={Users}>
            <p className="text-sm text-slate-500">各項目を1〜5で評価してください（5が最高）。</p>
            <div className="space-y-4">
              {([
                ['serviceQuality', '接客の洗練さ', '礼儀、日英対応、所作の丁寧さ'],
                ['quietness', '静かさ', '話しやすさ、BGMの音量、隣席との距離'],
                ['accessEase', 'アクセスのしやすさ', '最寄り駅からの距離、迷いにくさ'],
                ['confidentiality', '機密性', '個室の防音、視線の遮蔽、声の漏れにくさ'],
                ['ambiance', '雰囲気・格式', '空間の品格、接待相手への印象'],
              ] as const).map(([key, label, desc]) => (
                <div key={key} className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-slate-700 text-sm">{label}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                  <select
                    value={form.businessSpecs[key]}
                    onChange={(e) => updateSpec(key, Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Section>

          {/* Tags */}
          <Section title="タグ・推奨シーン" icon={Phone}>
            <Field label="タグ">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="完全個室、接待最適..."
                  className={inputCls}
                />
                <button type="button" onClick={addTag} className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-400 transition-colors cursor-pointer">
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            </Field>

            <Field label="推奨利用シーン">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sceneInput}
                  onChange={(e) => setSceneInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addScene())}
                  placeholder="役員接待、海外VIP接待..."
                  className={inputCls}
                />
                <button type="button" onClick={addScene} className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-400 transition-colors cursor-pointer">
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.recommendedFor.map((s) => (
                  <span key={s} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                    {s}
                    <button type="button" onClick={() => removeScene(s)} className="ml-0.5 hover:text-red-500 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            </Field>
          </Section>

          {/* Image URL */}
          <Section title="画像" icon={Building2}>
            <Field label="メイン画像 URL">
              <input type="url" value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} placeholder="https://example.com/image.jpg" className={inputCls} />
            </Field>
            {form.imageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden h-40 bg-slate-100">
                <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </Section>

          {/* Payment summary */}
          {form.paymentMethods.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <CreditCard size={14} className="text-indigo-500" />
              <span className="text-sm text-indigo-700">
                支払い方法: {form.paymentMethods.join('、')}
              </span>
            </div>
          )}

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {saveError}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setForm(INITIAL)}
              className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              リセット
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? '保存中...' : '店舗を登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/auth';
import { ownerTrialRepository as repository } from '../data/ownerTrialClient';
import type { OwnerTrialContext, TrialProfile, TrialReview } from '../data/repositories/ownerTrialRepository';
import { ReviewGatewayError } from '../data/repositories/proposedReviewRepository';
import { OWNER_TEST_COMMENT, searchPilotRestaurants, type PilotRestaurant } from '../domain/ownerTrial';
import { FACT_LABELS, factValue, safeExternalUrl, type FactField } from '../domain/dining';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { routeHash } from '../lib/routing';
import { isUuid } from '../domain/reviews';
import { VerifiedEvidence, VerifiedFactList } from '../components/VerifiedFacts';
const checked=(value:string)=>new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo'}).format(new Date(value));
interface TrialRoute { page: Page; restaurantId?: string; params: SearchParams }
interface TrialProps { route: TrialRoute; onNavigate: (page: Page, id?: string, params?: SearchParams) => void }
function Workspace({ route, onNavigate }: TrialProps) {
 const params = route.params;
 const query = params.query ?? ''; const genre = params.genre ?? '';
 const selected = route.page === 'nagoya-detail' ? route.restaurantId ?? '' : '';
 const compared = [...new Set((params.ids ?? '').split(',').filter(isUuid))].slice(0,3);
 const view = route.page === 'compare' ? 'compare' : params.view === 'mine' || params.view === 'queue' ? params.view : 'catalog';
 const change = (next: SearchParams) => {
   window.history.replaceState(null, '', routeHash(route.page, route.restaurantId, next));
   window.dispatchEvent(new HashChangeEvent('hashchange'));
 };
 const navigate = (next: 'catalog'|'compare'|'mine'|'queue') => onNavigate(next === 'compare' ? 'compare' : 'nagoya', undefined, { ...params, view: next === 'catalog' || next === 'compare' ? undefined : next });
 const select = (id: string) => onNavigate(id ? 'nagoya-detail' : 'nagoya', id || undefined, { ...params, view: undefined });
 const [context,setContext]=useState<OwnerTrialContext|null>(null);
 const [rows,setRows]=useState<PilotRestaurant[]>([]);
 const [profile,setProfile]=useState<TrialProfile|null>(null);
 const [mine,setMine]=useState<TrialReview[]>([]);
 const [queue,setQueue]=useState<TrialReview[]>([]);
 const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [message,setMessage]=useState('');
 const [consent,setConsent]=useState(false); const [busy,setBusy]=useState(false); const [uncertain,setUncertain]=useState(false); const [confirmDelete,setConfirmDelete]=useState(false);
 const alive=useRef(true); const refreshSequence=useRef(0); const guard=useRef(false); const attempts=useRef(new Map<string,string>());
 const refresh=async(signal?:AbortSignal)=>{
   const sequence=++refreshSequence.current;
   const next=await repository!.context(signal);
   const [catalog,ownProfile,reviews,pending]=await Promise.all([next.active?repository!.catalog(signal):Promise.resolve([]),repository!.profile(signal),repository!.mine(signal),next.active&&next.canModerate?repository!.queue(signal):Promise.resolve([])]);
   if(!alive.current||signal?.aborted||sequence!==refreshSequence.current)return;
   const active=next.active&&Date.parse(next.endsAt)>Date.now();
   setContext({...next,active});setRows(active?catalog:[]);setProfile(ownProfile);setMine(reviews);setQueue(pending);

 };
 useEffect(()=>{
   alive.current=true;const controller=new AbortController();
   void refresh(controller.signal).catch(()=>{if(!controller.signal.aborted)setError('このアカウントの非公開テストはまだ有効になっていないか、接続できません。設定の確認後に再読み込みしてください。');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
   return()=>{alive.current=false;controller.abort();};
 // This workspace is remounted for every authenticated user; no cross-account cache.
 },[]);
 useEffect(()=>{
   if(!context?.active)return;
   const timer=window.setTimeout(()=>{setContext(current=>current?{...current,active:false}:null);setRows([]);setQueue([]);},Math.max(0,Date.parse(context.endsAt)-Date.now()));
   return()=>window.clearTimeout(timer);
 },[context]);
 const reload=async()=>{setLoading(true);setError('');try{await refresh();if(alive.current)setUncertain(false);}catch{if(alive.current){setContext(null);setRows([]);setMine([]);setQueue([]);setProfile(null);setError('読み込めませんでした。接続と利用権限を確認して再読み込みしてください。');}}finally{if(alive.current)setLoading(false);}};
 const mutate=async(key:string,action:(requestId:string)=>Promise<void>,success:string)=>{
   if(guard.current||uncertain)return; guard.current=true;setBusy(true);setError('');setMessage('');let accepted=false;
   let id=attempts.current.get(key);if(!id){id=crypto.randomUUID();attempts.current.set(key,id);}
   try{await action(id);accepted=true;await refresh();if(alive.current){setMessage(success);attempts.current.delete(key);}}
   catch(reason){if(alive.current){const unknown=reason instanceof ReviewGatewayError&&reason.code==='unconfirmed';setUncertain(unknown||accepted);setError(accepted?'操作は受け付けられました。一覧を再読み込みして確認してください。':reason instanceof ReviewGatewayError?reason.message:'操作結果を確認できませんでした。受付状況を再確認してください。');if(!unknown&&!accepted)attempts.current.delete(key);if(reason instanceof ReviewGatewayError&&reason.code==='denied'){setContext(null);setRows([]);setMine([]);setQueue([]);setProfile(null);}}}
   finally{guard.current=false;if(alive.current){setBusy(false);setConfirmDelete(false);}}
 };
 const filtered=useMemo(()=>searchPilotRestaurants(rows,query,genre),[rows,query,genre]);
 const genres=[...new Set(rows.flatMap(row=>row.facts.filter(f=>f.field==='genre').map(f=>f.value)))];
 const detail=rows.find(row=>row.id===selected);
 const toggle=(id:string)=>change({...params,ids:(compared.includes(id)?compared.filter(value=>value!==id):compared.length<3?[...compared,id]:compared).join(',')||undefined});
 const name=(id:string)=>rows.find(row=>row.id===id)?.name??'テスト対象の店舗';
 const notices=<>{error&&<p role="alert" className="sample-notice">{error}</p>}{message&&<p role="status" className="sample-notice">{message}</p>}{uncertain&&<p>自動再送はしていません。「受付状況を再確認」で保存済みの内容を確かめてください。</p>}</>;
 if(loading&&!context)return <p role="status">実店舗とテスト権限を確認しています…</p>;
 if(!context)return <div className="catalog-empty">{notices}<button className="button-secondary" disabled={loading} onClick={()=>void reload()}>再読み込み</button></div>;
 const reviewList=(reviews:TrialReview[],editorial=false)=><div className="curation-list">{!reviews.length?<div className="catalog-empty"><h2>{editorial?'審査キューにテスト投稿はありません':'テスト投稿はまだありません'}</h2></div>:reviews.map(review=><article className="curation-card" key={review.id}><p className="eyebrow">PRIVATE TEST / {review.status==='withdrawn'?'取り下げ済み':'審査待ち（テスト）'}</p><h3>{name(review.restaurantId)}</h3><p>{review.comment}</p><p className="draft-privacy-note">操作確認月 {review.visitedMonth} · ダミー評価 {review.rating}/5。実際の来店評価ではありません。</p>{editorial?<p>自分のテスト投稿は承認できません。テスト行は他の運営者も承認できない設定です。</p>:review.status!=='withdrawn'&&<button className="button-secondary" disabled={busy||uncertain} onClick={()=>void mutate(`withdraw:${review.id}:${review.version}`,id=>repository!.withdraw(review.id,review.version,id),'テスト投稿を取り下げました。')}>このテスト投稿を取り下げる</button>}</article>)}</div>;
 return <>
   <div className="catalog-explainer"><p>店舗は登録済みの実在10店です。公式の確認記録を使いますが、一般公開前の候補です。プロフィールと口コミだけを、架空の固定値で操作テストします。</p></div>
   <p className="draft-privacy-note">{context.active?`テスト期限：${new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'}).format(new Date(context.endsAt))}。`:'テスト受付と店舗閲覧の期間は終了しました。'}一般公開・実際の口コミ投稿・会員募集は開始していません。</p>
   <div className="pilot-toolbar"><div className="pilot-tabs">{context.active&&<><button className="button-secondary" aria-pressed={view==='catalog'} onClick={()=>{navigate('catalog');}}>実店舗一覧</button><button className="button-secondary" aria-pressed={view==='compare'} onClick={()=>navigate('compare')}>候補を比較（{compared.length}）</button></>}<button className="button-secondary" aria-pressed={view==='mine'} onClick={()=>navigate('mine')}>自分のテスト投稿</button>{context.active&&context.canModerate&&<button className="button-secondary" aria-pressed={view==='queue'} onClick={()=>navigate('queue')}>審査キューを見る</button>}</div><button className="catalog-reset" disabled={busy||loading} onClick={()=>void reload()}>{uncertain?'受付状況を再確認':'再読み込み'}</button></div>
   {notices}
   {context.active&&<details className="membership-card pilot-profile" open={!profile?.publicConsented}><summary>{profile?.publicConsented?'架空プロフィール（準備済み）':'架空プロフィールの準備'}</summary><p>会社名「架空会社」・氏名「架空の人物」・役職「架空の正式職名」を使います。実際の個人情報は入力できません。</p><p>公開表示の例：製薬業界・大規模企業 / 部門マネジメント / K・T（自己申告の架空例）</p>{profile?.publicConsented?<p role="status">テスト用プロフィールは準備済みです。</p>:<><label className="draft-check"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} />架空のプロフィールだけを非公開テスト用に保存します</label><button className="button-secondary" disabled={!consent||busy||uncertain} onClick={()=>void mutate(`profile:${profile?.version??0}`,id=>repository!.prepareProfile(profile?.version??0,id),'架空プロフィールを準備しました。実店舗を選んで投稿テストを進められます。')}>架空プロフィールを準備する</button></>}</details>}
   {context.active&&view==='catalog'&&selected&&!detail&&<p role="status">この店舗は現在確認できません。一覧から掲載情報を選び直してください。</p>}
   {context.active&&view==='catalog'&&!detail&&<><div className="catalog-toolbar"><label className="catalog-search"><input aria-label="非公開の実店舗を検索" value={query} onChange={event=>change({...params,query:event.target.value||undefined})} placeholder="実店舗名・所在地・個室など" /></label><label>料理<select aria-label="非公開テストの料理" value={genre} onChange={event=>change({...params,genre:event.target.value||undefined})}><option value="">すべて</option>{genres.map(value=><option key={value}>{value}</option>)}</select></label></div><p className="catalog-count">実店舗 {filtered.length} / {rows.length}件（非公開）</p><div className="verified-list">{filtered.map(row=><article className="verified-card" key={row.id} data-pilot-id={row.id}><p className="eyebrow">{row.status==='candidate'?'掲載前の候補':'掲載承認済み'} / 非公開テスト</p><h2>{row.name}</h2><p>{row.address}</p><p className="draft-privacy-note">事実の確認日 {checked(row.factsCheckedAt)}</p><VerifiedFactList restaurant={row} compact /><div className="curation-actions"><button className="button-secondary" onClick={()=>select(row.id)}>店舗の詳細を見る</button><button className="button-secondary" aria-pressed={compared.includes(row.id)} disabled={compared.length>=3&&!compared.includes(row.id)} onClick={()=>toggle(row.id)}>{compared.includes(row.id)?'比較から外す':'比較に追加'}</button></div></article>)}</div>{!filtered.length&&<p>条件に合う実店舗がありません。</p>}</>}
   {context.active&&view==='catalog'&&detail&&<article className="verified-card"><button className="catalog-reset" onClick={()=>select('')}>実店舗一覧へ戻る</button><h2>{detail.name}</h2><p>{detail.address}</p><p className="draft-privacy-note">一般公開前の情報です。営業案内は確認時点の内容で、予約前に最新情報をお店へご確認ください。</p><VerifiedFactList restaurant={detail}/><VerifiedEvidence restaurant={detail}/>{factValue(detail,'website')&&<a className="button-secondary" href={safeExternalUrl(factValue(detail,'website')!)!} target="_blank" rel="noreferrer">公式サイトを見る</a>}<section className="review-draft-preview"><h3>この店舗で投稿テスト</h3><p>{OWNER_TEST_COMMENT}</p><p>本文・ダミー評価3・操作確認月はシステムが固定します。実際の来店を申告する操作ではありません。</p>{mine.some(review=>review.restaurantId===detail.id)?<p>この店舗のテスト投稿があります。「自分のテスト投稿」で確認できます。</p>:<button className="primary-button" disabled={!profile?.publicConsented||busy||uncertain} onClick={()=>void mutate(`submit:${detail.id}:${profile?.version}`,id=>repository!.submit(detail.id,profile!.version,id),'非公開のテスト投稿を受け付けました。自分の投稿と審査キューから確認できます。')}>固定のテスト投稿を送信する</button>}<p className="draft-privacy-note">架空プロフィールの準備が必要です。送信テストは24時間の枠で5回までです。</p></section></article>}
   {context.active&&view==='compare'&&<><h2>実店舗の候補を比較</h2><p className="comparison-scroll-note">表を左右にスクロールして、各店舗の条件を比較できます。</p>{compared.length<2?<p>一覧から2〜3店を選んでください。</p>:<div className="comparison-table-scroll" role="region" aria-label="非公開の実店舗比較" tabIndex={0}><table className="comparison-table"><thead><tr><th>確認項目</th>{compared.map(id=><th key={id}><h3>{name(id)}</h3><button className="catalog-reset" onClick={()=>{select(id);}}>詳細を見る</button></th>)}</tr></thead><tbody>{(['private_room','price','notice'] as FactField[]).map(field=><tr key={field}><th>{FACT_LABELS[field]}</th>{compared.map(id=><td key={id}>{rows.find(row=>row.id===id)?factValue(rows.find(row=>row.id===id)!,field)??'未確認':'現在は確認できません'}</td>)}</tr>)}</tbody></table></div>}<button className="catalog-reset" onClick={()=>change({...params,ids:undefined})}>比較の選択を解除</button></>}
   {(view==='mine'||!context.active)&&<><h2>自分の非公開テスト投稿</h2>{reviewList(mine)}{profile&&<div className="membership-card"><h3>テストデータを片付ける</h3><p>架空プロフィールと、自分のテスト投稿・関連メモを削除します。店舗情報やログインアカウントは消しません。回数制限の集計は残ります。</p>{confirmDelete?<><button className="button-secondary" disabled={busy||uncertain} onClick={()=>void mutate(`delete:${profile.version}`,id=>repository!.deleteProfile(profile.version,id),'テスト用プロフィールと投稿を削除しました。')}>テストデータの削除を確定</button><button className="catalog-reset" onClick={()=>setConfirmDelete(false)}>キャンセル</button></>:<button className="button-secondary" disabled={busy||uncertain} onClick={()=>setConfirmDelete(true)}>テストデータを削除する</button>}</div>}</>}
   {context.active&&view==='queue'&&<><h2>自分の投稿が審査キューへ届くか確認</h2>{reviewList(queue,true)}</>}
 </>;
}
export default function OwnerTrial(props: TrialProps) {
 const {user,loading}=useAuth();
 return <div className="page-width catalog-page owner-trial"><p className="eyebrow">PRIVATE OWNER TRIAL</p><h1>名古屋の会食店を探す</h1>{!repository?<p>データベースへの接続を準備しています。</p>:loading?<p role="status">ログインを確認しています…</p>:!user?<div className="catalog-empty"><h2>オーナーのログインが必要です</h2><p>いつものアカウントで上部のログインから入ってください。この画面は指定したオーナー本人だけが利用できます。</p></div>:<Workspace key={user.id} {...props}/>}</div>;
}

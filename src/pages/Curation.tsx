import { useEffect, useRef, useState } from 'react';
import ReviewReadiness from '../components/ReviewReadiness';
import { useAuth } from '../contexts/auth';
import { emailSignInEnabled, googleSignInEnabled } from '../lib/supabase';
import { diningRepository } from '../data/diningClient';
import { FACT_LABELS, safeExternalUrl, type EditorialRestaurant, type FactField, type VerificationStatus } from '../domain/dining';
const statusLabels: Record<VerificationStatus, string> = { candidate: '確認待ち', verified: '掲載承認済み', rejected: '掲載対象外' };
function CandidateEditor({ row, reload }: { row: EditorialRestaurant; reload: () => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [field, setField] = useState<FactField>('name');
  const [value, setValue] = useState('');
  const [url, setUrl] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<VerificationStatus | null>(null);
  const guard = useRef(false);
  const execute = async (action: () => Promise<void>) => {
    if (guard.current) return;
    guard.current = true; setBusy(true); setError('');
    try { await action(); await reload(); }
    catch { setError('更新できませんでした。確認項目の不足、権限、または別の編集による変更を確認し、一覧を再読み込みしてください。'); }
    finally { setBusy(false); guard.current = false; setConfirm(null); }
  };
  return <article className="curation-card"><p className="eyebrow">{statusLabels[row.status]} · v{row.version}</p><h2>{row.name}</h2><p>{row.address}</p>
    <details><summary>取得元・利用条件（{row.sources.length}件）</summary><ul>{row.sources.map(source => <li key={source.id}>{source.provider} · {safeExternalUrl(source.sourceUrl) && <a href={safeExternalUrl(source.sourceUrl)!} target="_blank" rel="noreferrer">出典を開く</a>}<br />取得 {source.fetchedAt} / 確認 {source.verifiedAt ?? '未確認'}<br />ライセンス：{source.licenses.join(', ') || '未記載'} · 公開根拠：{source.publicationBasis}<br />{source.attributions.join(' / ')}{source.rawRecord && <details><summary>取得時の資料を見る（未審査）</summary><pre className="source-snapshot">{JSON.stringify(source.rawRecord, null, 2)}</pre></details>}</li>)}</ul></details>
    <details><summary>確認済み項目（{row.facts.length}件）</summary><ul>{row.facts.map(fact => <li key={fact.field}>{FACT_LABELS[fact.field]}：{fact.value}</li>)}</ul></details>
    <details><summary>公式情報を確認して記録する</summary><p>店舗の公式ページを開き、事実を自分の言葉で短く記録してください。写真・紹介文・他サイトの口コミは転載しません。保存すると掲載承認は解除され、再審査になります。</p><form onSubmit={event => { event.preventDefault(); if (checked) void execute(() => diningRepository!.recordFact(row.id, row.version, field, value, url)); }}>
      <label>確認項目<select value={field} onChange={event => setField(event.target.value as FactField)}>{Object.entries(FACT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>確認した事実<textarea required maxLength={1500} value={value} onChange={event => setValue(event.target.value)} placeholder={field === 'coordinates' ? '経度,緯度（店舗単位の位置を確認した場合のみ）' : '未確認の内容は入力しないでください'} /></label>
      <label>公式ページのURL<input type="url" required pattern="https://.*" value={url} onChange={event => setUrl(event.target.value)} /></label>
      <label><span><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} style={{ width: 'auto', marginRight: 8 }} />公式ページを開き、上記の事実と利用条件を確認しました</span></label>
      <button className="button-secondary" disabled={busy || !checked}>確認記録を保存</button>
    </form></details>
    <label>審査理由<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} placeholder="掲載判断の理由・確認した内容" /></label>
    <div className="curation-actions">{(['verified', 'candidate', 'rejected'] as const).map(status => <button className="button-secondary" key={status} disabled={busy || !reason.trim() || row.status === status} onClick={() => setConfirm(status)}>{status === 'verified' ? '掲載を承認' : status === 'candidate' ? '確認待ちに戻す' : '対象外にする'}</button>)}</div>
    {confirm && <div className="curation-confirm"><p>「{row.name}」を「{statusLabels[confirm]}」に変更します。{confirm === 'verified' ? '公開スイッチが有効な場合、承認した情報が一般公開されます。' : '掲載中の場合は公開一覧から非表示になります。'}</p><div className="curation-actions"><button className="button-secondary" disabled={busy} onClick={() => void execute(() => diningRepository!.moderate(row.id, row.version, confirm, reason))}>確定する</button><button className="button-secondary" disabled={busy} onClick={() => setConfirm(null)}>キャンセル</button></div></div>}
    {error && <p role="alert">{error}</p>}
  </article>;
}
function EditorWorkspace() {
  const [state, setState] = useState<'loading' | 'denied' | 'ready' | 'error'>('loading');
  const [rows, setRows] = useState<EditorialRestaurant[]>([]);
  const [revision, setRevision] = useState(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    void (async () => {
      try {
        if (await diningRepository!.canEdit(controller.signal) !== true) { if (!controller.signal.aborted) setState('denied'); return; }
        const queue = await diningRepository!.listEditorial(controller.signal);
        if (!controller.signal.aborted) { setRows(queue); setState('ready'); }
      } catch { if (!controller.signal.aborted) setState('error'); }
    })();
    return () => { alive.current = false; controller.abort(); };
  }, [revision]);
  const reload = async () => {
    const queue = await diningRepository!.listEditorial();
    if (alive.current) setRows(queue);
  };
  if (state === 'loading') return <p role="status">編集権限を確認しています…</p>;
  if (state === 'denied') return <div className="catalog-empty"><h2>編集権限が必要です</h2><p>このアカウントには運営者としての権限がありません。</p></div>;
  if (state === 'error') return <div className="catalog-empty" role="alert"><h2>審査データを読み込めません</h2><p>接続と権限を確認してください。</p><button className="button-secondary" onClick={() => { setState('loading'); setRevision(value => value + 1); }}>再読み込み</button></div>;
  return <><a className="button-secondary" href="#/pilot">実店舗の非公開テストへ</a><ReviewReadiness /><p className="catalog-count">最新 {rows.length}件（最大200件） / 口コミ受付は別途準備中</p><button className="button-secondary" onClick={() => { setState('loading'); setRevision(value => value + 1); }}>一覧を再読み込み</button><div className="curation-list">{rows.map(row => <CandidateEditor key={`${row.id}:${row.version}`} row={row} reload={reload} />)}</div>{!rows.length && <div className="catalog-empty"><h2>確認待ちの候補はありません</h2><p>取得候補は、重複・出典を確認してから管理者が取り込みます。</p></div>}</>;
}
export default function Curation() {
  const { user, loading } = useAuth();
  return <div className="page-width catalog-page"><div className="catalog-heading"><div><p className="eyebrow">EDITORIAL WORKSPACE</p><h1>店舗情報の確認・審査</h1></div></div><p className="catalog-explainer">候補の取得と掲載承認は別の操作です。店名・所在地・公式サイトの確認記録が揃うまで、掲載は承認できません。</p><div style={{ marginTop: 24 }}>{!diningRepository ? <div className="catalog-empty"><h2>管理機能は接続準備中です</h2><p>店舗データベースと編集権限の確認が完了してから利用できます。</p><a href="#/admin">ブラウザ内で掲載情報の下書きを作る</a></div> : loading ? <p role="status">ログイン状態を確認しています…</p> : !user ? <div className="catalog-empty"><h2>運営者のログインが必要です</h2><p>{(googleSignInEnabled || emailSignInEnabled) ? '上部のログインから、編集権限のあるアカウントでログインしてください。' : 'ログイン設定の確認が完了してから利用できます。'}</p></div> : <EditorWorkspace key={user.id} />}</div></div>;
}

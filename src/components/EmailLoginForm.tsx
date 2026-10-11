import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth';
import { emailCallbackError } from '../lib/emailLogin';
export default function EmailLoginForm() {
  const { signInWithEmail, emailRetryAt, emailSending } = useAuth();
  const [email, setEmail] = useState('');
  const [now, setNow] = useState(Date.now);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(() => emailCallbackError(window.location.hash));
  useEffect(() => {
    if (!emailRetryAt) return;
    const timer = window.setInterval(() => {
      const current = Date.now(); setNow(current);
      if (current >= emailRetryAt) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [emailRetryAt]);
  const remaining = Math.max(0, Math.ceil((emailRetryAt - now) / 1000));
  const send = async (event: React.FormEvent) => {
    event.preventDefault(); setNow(Date.now()); setError(''); setMessage('');
    try {
      await signInWithEmail(email);
      setMessage('メール送信を受け付けました。受信したログイン用リンクを開いてください。');
    } catch {
      setError('メールを送信できませんでした。招待されたメールアドレスか確認し、少し待ってからお試しください。');
    }
  };
  return <form className="email-login-form" onSubmit={send}>
    <p className="quiet-label">招待された管理者のメールアドレスを入力してください。</p>
    <label htmlFor="admin-login-email">メールアドレス</label>
    <input id="admin-login-email" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={emailSending} />
    <button className="primary-button" type="submit" disabled={emailSending || remaining > 0}>{emailSending ? '送信中…' : remaining > 0 ? `再送まで${remaining}秒` : 'ログインリンクを送る'}</button>
    <p className="quiet-label">送信回数には上限があります。届かない場合は迷惑メールも確認し、再送まで少しお待ちください。</p>
    {message && <p role="status" className="sample-notice">{message}</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </form>;
}

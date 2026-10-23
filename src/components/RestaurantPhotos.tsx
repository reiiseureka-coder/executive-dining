import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  getRestaurantGallery, ILLUSTRATION_DISCLAIMER, officialRestaurantGalleries,
  type RestaurantVisual,
} from '../data/restaurantPhotos';
import '../styles/restaurant-photos.css';

export interface RestaurantPhotosProps {
  restaurantId: string;
  restaurantName: string;
  genre?: string;
  variant?: 'card' | 'detail';
}

function ImageCaption({ visual, expanded = false }: { visual: RestaurantVisual; expanded?: boolean }) {
  if (visual.kind === 'illustration') {
    return <>
      <span className="restaurant-photo-kind">生成 / UI確認用</span>
      <span className="restaurant-photo-disclaimer">{ILLUSTRATION_DISCLAIMER}</span>
      {expanded && <span className="restaurant-photo-description">{visual.caption}</span>}
    </>;
  }
  return <>
    <span className="restaurant-photo-description">{visual.caption}</span>
    <span className="restaurant-photo-credit">{visual.rights.attribution}</span>
    {expanded && <span className="restaurant-photo-rights">
      <a href={visual.rights.sourceUrl} target="_blank" rel="noreferrer">写真の出典</a>
      {visual.rights.licenseUrl
        ? <a href={visual.rights.licenseUrl} target="_blank" rel="noreferrer">{visual.rights.licenseName ?? '写真の利用条件'}</a>
        : visual.rights.licenseName && <span>{visual.rights.licenseName}</span>}
    </span>}
  </>;
}

function RestaurantPhotoGallery({ restaurantId, restaurantName, genre, variant = 'card' }: RestaurantPhotosProps) {
  const gallery = getRestaurantGallery(restaurantId, genre);
  const [failedIds, setFailedIds] = useState<readonly string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const focusScopeRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(false);
  const captionId = useId();
  const available = gallery.filter(visual => !failedIds.includes(visual.id));
  const active = available.find(visual => visual.id === activeId) ?? available[0];
  const activeIndex = active ? available.findIndex(visual => visual.id === active.id) : -1;
  const thumbnails = available.slice(0, variant === 'card' ? 1 : 2);
  const officialGallery = officialRestaurantGalleries[restaurantId];
  const illustrative = gallery[0]?.kind === 'illustration';

  const restoreFocus = useCallback(() => {
    const opener = openerRef.current;
    const scope = focusScopeRef.current;
    // Wait for React to remove failed thumbnails before choosing a surviving control.
    requestAnimationFrame(() => {
      if (opener?.isConnected && !opener.disabled && opener.getClientRects().length) {
        opener.focus({ preventScroll: true });
        return;
      }
      const candidates = scope?.querySelectorAll<HTMLElement>(
        '[data-gallery-focus-fallback], a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
      );
      const fallback = candidates && [...candidates].find(element => element.isConnected
        && !element.closest('dialog') && !element.closest('[inert]') && element.getClientRects().length);
      fallback?.focus({ preventScroll: true });
    });
  }, []);

  const closeGallery = useCallback(() => {
    const shouldRestore = openRef.current;
    openRef.current = false;
    dialogRef.current?.close();
    setActiveId(null);
    if (shouldRestore) restoreFocus();
  }, [restoreFocus]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (activeId !== null && available.length && dialog && !dialog.open) dialog.showModal();
  }, [activeId, available.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (openRef.current) {
        openRef.current = false;
        dialog?.close();
        restoreFocus();
      }
    };
  }, [restoreFocus]);

  function openGallery(visual: RestaurantVisual, trigger: HTMLButtonElement) {
    openerRef.current = trigger;
    focusScopeRef.current = trigger.closest('article') ?? trigger.closest('main') ?? trigger.parentElement;
    openRef.current = true;
    setActiveId(visual.id);
  }

  function failImage(id: string) {
    const remaining = available.filter(visual => visual.id !== id);
    setFailedIds(previous => previous.includes(id) ? previous : [...previous, id]);
    if (!remaining.length) closeGallery();
    else if (activeId === id) setActiveId(remaining[0].id);
  }

  function movePhoto(direction: -1 | 1) {
    if (available.length > 1) {
      setActiveId(available[(activeIndex + direction + available.length) % available.length].id);
    }
  }

  // A broken illustration must never leave a framed placeholder in a restaurant card.
  if (!available.length && variant === 'card') return null;

  return <div className={`restaurant-photos restaurant-photos--${variant}`}>
    {available.length ? <div className="restaurant-photo-grid">
      {thumbnails.map(visual => <figure className="restaurant-photo-tile" key={visual.id}>
        <button className="restaurant-photo-open" type="button"
          aria-label={visual.kind === 'illustration'
            ? `${restaurantName}のUI確認用イメージを拡大：${visual.caption}（実店舗の写真ではありません）`
            : `${restaurantName}の写真を拡大：${visual.caption}`}
          aria-haspopup="dialog" onClick={event => openGallery(visual, event.currentTarget)}>
          <img src={visual.src} alt={visual.alt} width={visual.width} height={visual.height}
            loading="lazy" onError={() => failImage(visual.id)} />
          <span className="restaurant-photo-enlarge" aria-hidden="true">拡大する ↗</span>
        </button>
        <figcaption className="restaurant-photo-caption"><ImageCaption visual={visual} /></figcaption>
      </figure>)}
    </div> : <p className="restaurant-photo-unavailable" role="status">画像を読み込めませんでした。</p>}

    {variant === 'detail' && officialGallery && <p className="restaurant-photo-official">
      <span>実際の店舗の写真は公式サイトでご確認ください。</span>
      <a href={officialGallery} target="_blank" rel="noreferrer">公式サイトで店舗の写真を見る <span aria-hidden="true">↗</span></a>
    </p>}

    {!!available.length && <dialog className="restaurant-photo-dialog" ref={dialogRef}
      aria-label={`${restaurantName}の写真を拡大`} aria-describedby={captionId}
      onCancel={event => { event.preventDefault(); closeGallery(); }} onClose={closeGallery}
      onClick={event => { if (event.target === event.currentTarget) closeGallery(); }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <div className="restaurant-photo-dialog-content">
        <header className="restaurant-photo-dialog-header">
          <p>{illustrative ? 'UI確認用のイメージ' : restaurantName}</p>
          <button type="button" className="restaurant-photo-close" aria-label="写真を閉じる" onClick={closeGallery} autoFocus>閉じる ×</button>
        </header>
        {activeId !== null && active && <figure className="restaurant-photo-expanded" key={active.id}>
          <img src={active.src} alt={active.alt} width={active.width} height={active.height}
            onError={() => failImage(active.id)} />
          <figcaption className="restaurant-photo-caption" id={captionId}><ImageCaption visual={active} expanded /></figcaption>
        </figure>}
        <div className="restaurant-photo-paging">
          <button type="button" aria-label="前の写真" disabled={available.length < 2} onClick={() => movePhoto(-1)}>← 前へ</button>
          <span role="status" aria-live="polite" aria-atomic="true">{activeIndex + 1} / {available.length}</span>
          <button type="button" aria-label="次の写真" disabled={available.length < 2} onClick={() => movePhoto(1)}>次へ →</button>
        </div>
      </div>
    </dialog>}
  </div>;
}

/** Reset gallery/failure state between venues, without changing the surrounding catalog. */
export function RestaurantPhotos(props: RestaurantPhotosProps) {
  return <RestaurantPhotoGallery key={`${props.restaurantId}:${props.genre ?? ''}:${props.variant ?? 'card'}`} {...props} />;
}

export default RestaurantPhotos;

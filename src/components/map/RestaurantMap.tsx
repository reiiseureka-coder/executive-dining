import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { VerifiedRestaurant } from '../../domain/dining';
import { verifiedCoordinates } from '../../domain/dining';
import { configuredMapProvider } from './mapProvider';
import { classifyMapFailure, MAP_FAILURE_LABELS, type MapFailure } from './mapDiagnostics';
setWorkerUrl(workerUrl);
const provider = configuredMapProvider(import.meta.env.VITE_MAP_STYLE_URL);
export default function RestaurantMap({ restaurants, onSelect }: { restaurants: VerifiedRestaurant[]; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [failure, setFailure] = useState<MapFailure | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    let map: Map | undefined;
    let hadError = false;
    let active = true;
    let loaded = false;
    queueMicrotask(() => { if (active) { setFailure(null); setReady(false); } });
    const timeout = window.setTimeout(() => { if (active && !loaded && !hadError) { hadError = true; setFailure('network'); } }, 20_000);
    try {
      map = new Map({ container: container.current, style: provider.styleUrl, center: [136.899, 35.172], zoom: 12, attributionControl: { compact: false } });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.scrollZoom.disable();
      map.on('error', event => { hadError = true; if (active) setFailure(classifyMapFailure(event.error)); });
      map.on('load', () => { loaded = true; if (active && !hadError) setReady(true); });
      mapRef.current = map;
    } catch (error) { queueMicrotask(() => { if (active) setFailure(classifyMapFailure(error)); }); }
    return () => { active = false; window.clearTimeout(timeout); markersRef.current.forEach(marker => marker.remove()); markersRef.current = []; mapRef.current = null; map?.remove(); };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: Marker[] = [];
    for (const restaurant of restaurants) {
      const coordinates = verifiedCoordinates(restaurant);
      if (!coordinates) continue;
      const button = document.createElement('button');
      button.className = 'restaurant-map-pin'; button.textContent = '●';
      button.setAttribute('aria-label', `${restaurant.name}の掲載情報を表示`);
      button.addEventListener('click', () => onSelect(restaurant.id));
      markers.push(new Marker({ element: button }).setLngLat(coordinates).addTo(map));
    }
    markersRef.current = markers;
    return () => { markers.forEach(marker => marker.remove()); if (markersRef.current === markers) markersRef.current = []; };
  }, [restaurants, onSelect]);
  const pinCount = restaurants.filter(restaurant => verifiedCoordinates(restaurant)).length;
  return <section className="catalog-map" aria-label="名古屋エリアの地図" data-map-status={failure ?? (ready ? 'ready' : 'loading')}>
    <div ref={container} className="catalog-map-canvas" />
    {failure ? <p className="map-error" role="status">地図を読み込めませんでした。店舗情報は一覧から確認できます。<br />{MAP_FAILURE_LABELS[failure]}</p> : !ready && <p className="map-error" role="status">地図を読み込んでいます…</p>}
    <div className="map-caption"><span>位置を確認済みのお店：{pinCount}件。位置が未確認のお店は表示しません。</span><span>地図上の施設名には、このサービスに掲載していないお店も含まれます。</span>
      <span><a href={provider.attributionUrl} target="_blank" rel="noreferrer">{provider.name}</a>{provider.name === 'OpenFreeMap' && <> · <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></>}</span>
    </div>
  </section>;
}

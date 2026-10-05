import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { VerifiedRestaurant } from '../../domain/dining';
import { verifiedCoordinates } from '../../domain/dining';
import { configuredMapProvider } from './mapProvider';
setWorkerUrl(workerUrl);
const provider = configuredMapProvider(import.meta.env.VITE_MAP_STYLE_URL);
export default function RestaurantMap({ restaurants, onSelect }: { restaurants: VerifiedRestaurant[]; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    let map: Map | undefined;
    const markers: Marker[] = [];
    try {
      map = new Map({ container: container.current, style: provider.styleUrl, center: [136.899, 35.172], zoom: 12, attributionControl: { compact: false } });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.scrollZoom.disable();
      map.on('error', () => setFailed(true));
      for (const restaurant of restaurants) {
        const coordinates = verifiedCoordinates(restaurant);
        if (!coordinates) continue;
        const button = document.createElement('button');
        button.className = 'restaurant-map-pin';
        button.textContent = '●';
        button.setAttribute('aria-label', `${restaurant.name}の掲載情報を表示`);
        button.addEventListener('click', () => onSelect(restaurant.id));
        markers.push(new Marker({ element: button }).setLngLat(coordinates).addTo(map));
      }
    } catch { queueMicrotask(() => setFailed(true)); }
    return () => { markers.forEach(marker => marker.remove()); map?.remove(); };
  }, [restaurants, onSelect]);
  const pinCount = restaurants.filter(restaurant => verifiedCoordinates(restaurant)).length;
  return <section className="catalog-map" aria-label="名古屋エリアの地図">
    <div ref={container} className="catalog-map-canvas" />
    {failed && <p className="map-error" role="status">地図を読み込めませんでした。店舗情報は一覧から確認できます。</p>}
    <div className="map-caption"><span>確認済みの位置：{pinCount}件。位置が未確認のお店は表示しません。</span><span>背景地図の施設名は当サービスの確認済み掲載を示しません。</span>
      <span><a href={provider.attributionUrl} target="_blank" rel="noreferrer">{provider.name}</a>{provider.name === 'OpenFreeMap' && <> · <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></>}</span>
    </div>
  </section>;
}

export interface MapProvider { styleUrl: string; name: string; attributionUrl: string }
export const openFreeMap: MapProvider = {
  styleUrl: 'https://tiles.openfreemap.org/styles/liberty', name: 'OpenFreeMap', attributionUrl: 'https://openfreemap.org/',
};
export function configuredMapProvider(styleUrl?: string): MapProvider {
  if (!styleUrl) return openFreeMap;
  try {
    const url = new URL(styleUrl);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href === openFreeMap.styleUrl ? openFreeMap : { styleUrl: url.href, name: url.hostname, attributionUrl: url.origin };
  } catch { /* Fall back to the documented default. */ }
  return openFreeMap;
}

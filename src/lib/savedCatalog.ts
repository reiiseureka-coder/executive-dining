export const SAVED_CATALOG_KEY = 'executive-dining:verified-saved:v1';
export function parseSavedCatalogIds(raw: string): string[] {
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? [...new Set(data.filter((id): id is string => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))].slice(0, 1000) : [];
  } catch { return []; }
}

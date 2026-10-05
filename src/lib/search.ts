import type { Restaurant } from "../types/index.ts";

export interface SearchParams {
  query?: string;
  region?: string;
  area?: string;
  genre?: string;
  privateRoom?: string;
  meal?: string;
  budget?: string;
  sort?: string;
  saved?: string;
}
export const normalize = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase("ja").trim();

// Meal filters use listed sample opening hours, not an unrelated keyword match.
export function servesMeal(restaurant: Restaurant, meal?: string): boolean {
  if (!meal) return true;
  const starts = Array.from(
    restaurant.openHours.matchAll(/(\d{1,2}):\d{2}\s*[〜～–-]/g),
    (match) => Number(match[1]),
  );
  return meal === "lunch"
    ? starts.some((hour) => hour < 15)
    : starts.some((hour) => hour >= 15) ||
        /[〜～–-]\s*(?:1[7-9]|2[0-3]):/.test(restaurant.openHours);
}

export function filterRestaurants(
  restaurants: Restaurant[],
  params: SearchParams,
  savedIds: string[] = [],
): Restaurant[] {
  const terms = normalize(params.query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const filtered = restaurants.filter((restaurant) => {
    const text = normalize(
      [
        restaurant.name,
        restaurant.nameEn,
        restaurant.genre,
        restaurant.area,
        restaurant.address,
        restaurant.nearestStation,
        restaurant.description,
        restaurant.privateRoomType,
        ...restaurant.tags,
      ].join(" "),
    );
    return (
      terms.every((term) => text.includes(term)) &&
      (!params.region || restaurant.region === params.region) &&
      (!params.area || restaurant.area === params.area) &&
      (!params.genre || restaurant.genre === params.genre) &&
      (!params.privateRoom ||
        restaurant.privateRoomType === params.privateRoom) &&
      (!params.budget ||
        restaurant.avgPricePerPerson <= Number(params.budget)) &&
      servesMeal(restaurant, params.meal) &&
      (params.saved !== "1" || savedIds.includes(restaurant.id))
    );
  });
  return filtered.sort((a, b) => {
    if (params.sort === "price_asc")
      return a.avgPricePerPerson - b.avgPricePerPerson;
    if (params.sort === "price_desc")
      return b.avgPricePerPerson - a.avgPricePerPerson;
    if (params.sort === "name") return a.name.localeCompare(b.name, "ja");
    return 0;
  });
}

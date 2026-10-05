import type { Page } from "../types/index.ts";
import type { SearchParams } from "./search.ts";
const keys: (keyof SearchParams)[] = [
  "query",
  "region",
  "area",
  "genre",
  "privateRoom",
  "meal",
  "budget",
  "sort",
  "saved",
];
export function parseRoute(hash: string): {
  page: Page;
  restaurantId?: string;
  params: SearchParams;
} {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const params: SearchParams = {};
  const search = new URLSearchParams(query);
  for (const key of keys) if (search.get(key)) params[key] = search.get(key)!;
  if (path.startsWith("/restaurant/"))
    return {
      page: "detail",
      restaurantId: path.slice("/restaurant/".length),
      params,
    };
  const page = path.slice(1);
  return {
    page: ["search", "about", "admin"].includes(page) ? (page as Page) : "home",
    params,
  };
}
export function routeHash(
  page: Page,
  restaurantId?: string,
  params: SearchParams = {},
): string {
  const path =
    page === "home"
      ? "/"
      : page === "detail"
        ? `/restaurant/${encodeURIComponent(restaurantId ?? "")}`
        : `/${page}`;
  const query = new URLSearchParams();
  for (const key of keys) if (params[key]) query.set(key, params[key]!);
  return `#${path}${query.size ? `?${query}` : ""}`;
}

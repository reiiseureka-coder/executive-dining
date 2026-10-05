import test from "node:test";
import assert from "node:assert/strict";
import { filterRestaurants, normalize, servesMeal } from "../src/lib/search.ts";
import { parseRoute, routeHash } from "../src/lib/routing.ts";
import { readDraft } from "../src/lib/drafts.ts";
const base = {
  id: "1",
  name: "銀座 久兵衛",
  nameEn: "Ginza Kyubey",
  genre: "寿司",
  area: "銀座",
  region: "関東",
  address: "東京都中央区銀座",
  nearestStation: "銀座駅",
  description: "寿司と会食",
  privateRoomType: "完全個室",
  tags: ["会食"],
  avgPricePerPerson: 38000,
  openHours: "12:00〜14:00 / 17:00〜22:00",
};
const list = [
  base,
  {
    ...base,
    id: "2",
    name: "大阪レストラン",
    nameEn: "Osaka Dining",
    region: "関西",
    area: "大阪",
    nearestStation: "大阪駅",
    address: "大阪府大阪市",
    avgPricePerPerson: 18000,
    openHours: "17:00〜22:00",
  },
];
test("normalizes full-width text and case", () =>
  assert.equal(normalize(" ＧＩＮＺＡ "), "ginza"));
test("search includes address so Tokyo city shortcut works", () =>
  assert.deepEqual(
    filterRestaurants(list, { query: "東京" }).map((r) => r.id),
    ["1"],
  ));
test("multiple search words use AND and whitespace trims", () =>
  assert.equal(filterRestaurants(list, { query: " 銀座　寿司 " }).length, 1));
test("English names are case-insensitive", () =>
  assert.equal(filterRestaurants(list, { query: "GINZA" }).length, 1));
test("combines budget and saved candidates", () =>
  assert.deepEqual(
    filterRestaurants(list, { budget: "20000", saved: "1" }, ["2"]).map(
      (r) => r.id,
    ),
    ["2"],
  ));
test("saved empty state has no results", () =>
  assert.equal(filterRestaurants(list, { saved: "1" }, []).length, 0));
test("lunch and dinner use hours rather than absent keywords", () => {
  assert.equal(filterRestaurants(list, { meal: "lunch" }).length, 1);
  assert.equal(filterRestaurants(list, { meal: "dinner" }).length, 2);
});
test("all-day hours include dinner", () =>
  assert.equal(
    servesMeal({ ...base, openHours: "11:30〜22:00" }, "dinner"),
    true,
  ));
test("sort does not mutate catalog", () => {
  assert.deepEqual(
    filterRestaurants(list, { sort: "price_asc" }).map((r) => r.id),
    ["2", "1"],
  );
  assert.equal(list[0].id, "1");
});
test("reset clears keyword and filters", () =>
  assert.equal(filterRestaurants(list, {}).length, 2));
test("search route round trips Japanese and URL characters", () => {
  const params = {
    query: "銀座 & 寿司",
    budget: "40000",
    privateRoom: "完全個室",
    meal: "lunch",
    saved: "1",
  };
  assert.deepEqual(parseRoute(routeHash("search", undefined, params)), {
    page: "search",
    params,
  });
});
test("detail URL retains all return search conditions", () => {
  const params = { region: "関東", sort: "price_asc" };
  assert.deepEqual(parseRoute(routeHash("detail", "1", params)), {
    page: "detail",
    restaurantId: "1",
    params,
  });
});
test("OAuth fragment and invalid route do not break rendering", () => {
  assert.equal(parseRoute("#access_token=x").page, "home");
  assert.equal(parseRoute("#/unknown").page, "home");
});
test("draft malformed JSON falls back safely", () => {
  globalThis.localStorage = { getItem: () => "malformed" };
  assert.deepEqual(readDraft("draft", { author: "", rating: 0 }), {
    author: "",
    rating: 0,
  });
});
test("draft schema ignores incompatible types", () => {
  globalThis.localStorage = {
    getItem: () =>
      JSON.stringify({
        author: "A",
        rating: "bad",
        tags: [12],
        businessSpecs: null,
      }),
  };
  assert.deepEqual(
    readDraft("draft", {
      author: "",
      rating: 0,
      tags: [],
      businessSpecs: { quietness: 3 },
    }),
    { author: "A", rating: 0, tags: [], businessSpecs: { quietness: 3 } },
  );
});
test("draft storage unavailable is safe", () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
  };
  assert.deepEqual(readDraft("draft", { author: "" }), { author: "" });
});

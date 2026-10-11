import { useState } from "react";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Bookmark,
} from "lucide-react";
import type { Page } from "../types";
import { filterRestaurants, type SearchParams } from "../lib/search";
import { restaurants } from "../data/mockData";
import { useSavedRestaurants } from "../hooks/useSavedRestaurants";
import RestaurantCard from "../components/RestaurantCard";
import SampleNotice from "../components/SampleNotice";
interface SearchProps {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
  onNavigate: (page: Page, id?: string, params?: SearchParams) => void;
}
const options = (key: "region" | "genre" | "privateRoomType") => [
  ...new Set(restaurants.map((restaurant) => restaurant[key])),
];
export default function Search({ params, onChange, onNavigate }: SearchProps) {
  const [expanded, setExpanded] = useState(true);
  const { savedIds, storageWarning } = useSavedRestaurants();
  const results = filterRestaurants(restaurants, params, savedIds);
  const update = (key: keyof SearchParams, value: string) =>
    onChange({
      ...params,
      [key]: value,
      ...(key === "region" ? { area: "" } : {}),
    });
  const active = Object.entries(params).filter(
    ([key, value]) => value && key !== "sort",
  );
  const areas = [
    ...new Set(
      restaurants
        .filter(
          (restaurant) => !params.region || restaurant.region === params.region,
        )
        .map((restaurant) => restaurant.area),
    ),
  ];
  const selects: {
    key: keyof SearchParams;
    label: string;
    values: { value: string; label: string }[];
  }[] = [
    {
      key: "region",
      label: "地方",
      values: options("region").map((value) => ({ value, label: value })),
    },
    {
      key: "area",
      label: "エリア",
      values: areas.map((value) => ({ value, label: value })),
    },
    {
      key: "genre",
      label: "料理",
      values: options("genre").map((value) => ({ value, label: value })),
    },
    {
      key: "privateRoom",
      label: "個室",
      values: options("privateRoomType").map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "meal",
      label: "時間帯",
      values: [
        { value: "lunch", label: "ランチ" },
        { value: "dinner", label: "ディナー" },
      ],
    },
    {
      key: "budget",
      label: "1人あたりの予算目安",
      values: [
        { value: "15000", label: "15,000円以内" },
        { value: "20000", label: "20,000円以内" },
        { value: "30000", label: "30,000円以内" },
        { value: "40000", label: "40,000円以内" },
      ],
    },
  ];
  return (
    <div className="page-width search-page">
      <div className="page-heading">
        <p className="eyebrow">SAMPLE SEARCH</p>
        <h1>サンプルで検索を試す</h1>
        <p>この画面は動作確認用の6件のサンプルです。<a href="#/nagoya">名古屋の店舗一覧はこちら</a></p>
      </div>
      <SampleNotice compact />
      <section className="search-panel" aria-label="検索条件">
        <div className="search-toolbar">
          <label className="search-input">
            <SearchIcon size={18} />
            <span className="sr-only">キーワード</span>
            <input
              type="search"
              placeholder="店名・エリア・料理（複数語で検索）"
              value={params.query ?? ""}
              onChange={(event) => update("query", event.target.value)}
            />
          </label>
          <button
            className="filter-button"
            aria-expanded={expanded}
            aria-controls="search-filters"
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal size={17} />
            <span>条件</span>
            {active.length > 0 && <small>{active.length}</small>}
          </button>
        </div>
        {expanded && (
          <div className="filter-fields" id="search-filters">
            {selects.map(({ key, label, values }) => (
              <label key={key}>
                {label}
                <select
                  value={params[key] ?? ""}
                  onChange={(event) => update(key, event.target.value)}
                >
                  <option value="">指定なし</option>
                  {values.map(({ value, label: optionLabel }) => (
                    <option value={value} key={value}>
                      {optionLabel}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
        <div className="filter-bottom">
          <button
            className={`saved-filter ${params.saved === "1" ? "active" : ""}`}
            aria-pressed={params.saved === "1"}
            onClick={() => update("saved", params.saved === "1" ? "" : "1")}
          >
            <Bookmark size={16} />
            保存した候補<span>{savedIds.length}</span>
          </button>
          {active.length > 0 && (
            <button className="text-link" onClick={() => onChange({})}>
              <X size={14} />
              条件をすべて解除
            </button>
          )}
        </div>
        {active.length > 0 && (
          <div className="active-filters">
            {active.map(([key, value]) => {
              const label =
                key === "query"
                  ? `キーワード：${value}`
                  : key === "saved"
                    ? "保存した候補"
                    : (selects
                        .find((select) => select.key === key)
                        ?.values.find((option) => option.value === value)
                        ?.label ?? value);
              return (
                <button
                  key={key}
                  onClick={() => update(key as keyof SearchParams, "")}
                  aria-label={`${label}の条件を解除`}
                >
                  {label}
                  <X size={12} />
                </button>
              );
            })}
          </div>
        )}
      </section>
      <p className="filter-explainer">
        予算と時間帯は、サンプルの金額・営業時間で絞り込みます。空席は確認できません。候補の保存先は、このブラウザ内のみです。
      </p>
      {storageWarning && (
        <p role="status" className="sample-notice">
          {storageWarning}
        </p>
      )}
      <div className="results-heading">
        <p role="status" aria-live="polite">
          <strong>{results.length}</strong> 店{" "}
          <span> / 掲載サンプル {restaurants.length} 店</span>
        </p>
        <label>
          並び替え
          <select
            value={params.sort ?? ""}
            onChange={(event) => update("sort", event.target.value)}
          >
            <option value="">掲載順</option>
            <option value="price_asc">予算目安が低い順</option>
            <option value="price_desc">予算目安が高い順</option>
            <option value="name">店名順</option>
          </select>
        </label>
      </div>
      {results.length ? (
        <div className="restaurant-grid">
          {results.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={(id) => onNavigate("detail", id, params)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SearchIcon size={30} />
          <h2>
            {params.saved === "1" && savedIds.length === 0
              ? "保存した候補はありません"
              : "条件に合うお店がありません"}
          </h2>
          <p>
            {params.saved === "1" && savedIds.length === 0
              ? "お店の写真の右上にある保存ボタンで、候補に追加できます。"
              : "検索できるサンプルは6店です。キーワードや条件を変えてお試しください。"}
          </p>
          <button className="primary-button" onClick={() => onChange({})}>
            すべてのお店を見る
          </button>
        </div>
      )}
    </div>
  );
}

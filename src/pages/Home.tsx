import { useState } from "react";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import type { Page } from "../types";
import type { SearchParams } from "../lib/search";
import { restaurants } from "../data/mockData";
import RestaurantCard from "../components/RestaurantCard";
import SampleNotice from "../components/SampleNotice";
interface HomeProps {
  onNavigate: (
    page: Page,
    restaurantId?: string,
    params?: SearchParams,
  ) => void;
}
export default function Home({ onNavigate }: HomeProps) {
  const [query, setQuery] = useState("");
  return (
    <>
      <section className="home-hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">A PLACE FOR GOOD CONVERSATION</p>
          <h1>
            <span>大切な話を、</span>
            <span>心地よい一席で。</span>
          </h1>
          <p className="hero-description">
            個室、予算、アクセス。
            <br />
            会食の条件をひとつずつ確かめて、
            <br className="mobile-break" />
            次の一軒を見つける。
          </p>
          <form
            className="hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              onNavigate("search", undefined, { query: query.trim() });
            }}
          >
            <label className="sr-only" htmlFor="home-query">
              店名・エリア・料理を検索
            </label>
            <SearchIcon size={19} aria-hidden="true" />
            <input
              id="home-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="店名・エリア・料理"
              type="search"
            />
            <button type="submit">
              探す
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="quick-links">
            <span>条件から</span>
            <button
              onClick={() =>
                onNavigate("search", undefined, { privateRoom: "完全個室" })
              }
            >
              完全個室
            </button>
            <button
              onClick={() =>
                onNavigate("search", undefined, { budget: "20000" })
              }
            >
              2万円以内
            </button>
            <button
              onClick={() => onNavigate("search", undefined, { meal: "lunch" })}
            >
              ランチ
            </button>
          </div>
        </div>
        <figure className="hero-figure">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85"
            alt="落ち着いたレストランのテーブルセッティングのイメージ"
            fetchPriority="high"
          />
          <figcaption>
            <span>THE DINING NOTE</span>
            <span>ゆっくり話せる、その場所へ。</span>
          </figcaption>
        </figure>
      </section>
      <div className="page-width">
        <SampleNotice compact />
      </div>
      <section className="page-width section-space">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EXPLORE BY AREA</p>
            <h2>集まりやすい街から。</h2>
          </div>
          <button
            className="text-link"
            onClick={() => onNavigate("search", undefined, {})}
          >
            すべてのお店
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="area-list">
          {[
            { name: "東京", sub: "銀座・六本木・恵比寿・新宿", q: "東京" },
            { name: "京都", sub: "南禅寺", q: "京都" },
            { name: "大阪", sub: "北堀江", q: "大阪" },
          ].map((area, index) => (
            <button
              key={area.name}
              onClick={() => onNavigate("search", undefined, { query: area.q })}
            >
              <span className="area-number">0{index + 1}</span>
              <span>
                <strong>{area.name}</strong>
                <small>{area.sub}</small>
              </span>
              <ArrowRight size={20} />
            </button>
          ))}
        </div>
      </section>
      <section className="page-width section-space selection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>一席を選ぶ、手がかり。</h2>
            <p>気になるお店を保存して、条件を見比べる。</p>
          </div>
          <span className="quiet-label">
            掲載サンプル {restaurants.length} 店
          </span>
        </div>
        <div className="restaurant-grid">
          {restaurants.slice(0, 3).map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={(id) => onNavigate("detail", id)}
            />
          ))}
        </div>
        <div className="section-action">
          <button
            className="outline-button"
            onClick={() => onNavigate("search", undefined, {})}
          >
            条件を指定して探す
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <section className="planning-section">
        <div className="page-width planning-inner">
          <div>
            <p className="eyebrow">BEFORE YOU BOOK</p>
            <h2>
              いい会食は、
              <br />
              小さな確認から。
            </h2>
            <button className="text-link" onClick={() => onNavigate("about")}>
              このサービスについて
              <ArrowRight size={16} />
            </button>
          </div>
          <ol>
            {[
              {
                title: "話す内容に合った席を",
                text: "個室の仕切りや音の通り方は、予約時にお店へ確認。",
              },
              {
                title: "総額を先に確かめる",
                text: "コースに加えて、飲み物・サービス料・個室料も確認。",
              },
              {
                title: "行きも帰りも、無理なく",
                text: "駅からの道順、集合時間、帰りの交通手段まで。",
              },
            ].map((item, index) => (
              <li key={item.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

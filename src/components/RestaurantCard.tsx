import { ArrowUpRight, Bookmark, MapPin } from "lucide-react";
import type { Restaurant } from "../types";
import { useSavedRestaurants } from "../hooks/useSavedRestaurants";
interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (id: string) => void;
  featured?: boolean;
}
export default function RestaurantCard({
  restaurant,
  onClick,
}: RestaurantCardProps) {
  const { savedIds, toggleSaved } = useSavedRestaurants();
  const saved = savedIds.includes(restaurant.id);
  return (
    <article className="restaurant-card">
      <div className="restaurant-image">
        <button
          className="image-link"
          onClick={() => onClick(restaurant.id)}
          aria-label={`${restaurant.name}の詳細を見る`}
        >
          <img
            src={restaurant.imageUrl}
            alt={`${restaurant.genre}のイメージ写真（店舗の実写ではありません）`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.opacity = "0";
            }}
          />
        </button>
        <span className="image-caption">イメージ写真</span>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          onClick={() => toggleSaved(restaurant.id)}
          aria-pressed={saved}
          aria-label={`${restaurant.name}を${saved ? "候補から外す" : "候補に保存"}`}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="restaurant-content">
        <p className="restaurant-kicker">
          {restaurant.genre} <span> / </span> {restaurant.area}
        </p>
        <button
          className="restaurant-title"
          onClick={() => onClick(restaurant.id)}
        >
          <h3>{restaurant.name}</h3>
          <ArrowUpRight size={20} />
        </button>
        <p className="restaurant-station">
          <MapPin size={13} />
          {restaurant.nearestStation}
        </p>
        <div className="restaurant-facts">
          <span>{restaurant.privateRoomType}</span>
          <span>
            目安 ¥{restaurant.avgPricePerPerson.toLocaleString()} / 人
          </span>
        </div>
        <p className="sample-caption">店舗情報・予算はサンプル</p>
      </div>
    </article>
  );
}

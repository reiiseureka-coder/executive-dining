import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 20, readonly = false }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          disabled={readonly}
          aria-label={`${star}つ星`}
          aria-pressed={!readonly ? star === value : undefined}
        >
          <Star
            size={size}
            className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  );
}

export default function StarRating({ count, max = 5, size = 'md', interactive = false, onChange }) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = interactive ? star <= count : star <= count;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} transition-transform`}
          >
            <span className={filled ? 'star-filled' : 'star-empty'}>★</span>
          </button>
        );
      })}
    </div>
  );
}

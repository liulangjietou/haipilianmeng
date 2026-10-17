const SIZE = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export default function StarRating({ count, max = 5, size = 'md', interactive = false, onChange }) {
  return (
    <div className={`flex items-center gap-0.5 ${SIZE[size] || SIZE.md}`}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= count;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={`${
              interactive ? '-m-1 cursor-pointer p-1.5 active:scale-125' : 'cursor-default'
            } transition-transform`}
          >
            <span className={filled ? 'star-filled' : 'star-empty'}>★</span>
          </button>
        );
      })}
    </div>
  );
}

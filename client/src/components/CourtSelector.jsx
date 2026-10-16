const POSITIONS = [
  { id: 1, number: 1, name: '控球后卫', abbr: 'PG', top: '82%', left: '50%' },
  { id: 2, number: 2, name: '得分后卫', abbr: 'SG', top: '58%', left: '80%' },
  { id: 3, number: 3, name: '小前锋', abbr: 'SF', top: '58%', left: '20%' },
  { id: 4, number: 4, name: '大前锋', abbr: 'PF', top: '28%', left: '76%' },
  { id: 5, number: 5, name: '中锋', abbr: 'C', top: '26%', left: '32%' },
];

export default function CourtSelector({ activePos, onSelect, topNames }) {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[3/4] select-none">
      {/* Wood floor with plank texture */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 shadow-2xl shadow-black/40 overflow-hidden">
        {/* Wood planks */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(120,60,20,0.15) 28px, rgba(120,60,20,0.15) 30px)',
          }}
        />

        {/* Court border */}
        <div className="absolute inset-2 border-[3px] border-white/70 rounded-2xl" />

        {/* Half-court line near bottom */}
        <div className="absolute left-2 right-2 bottom-[18%] border-t-[3px] border-white/70" />

        {/* Center circle at bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 border-[3px] border-white/70 rounded-full aspect-square"
          style={{ width: '40%', bottom: '2%' }}
        />

        {/* 3-point arc at top */}
        <div
          className="absolute left-1/2 -translate-x-1/2 border-[3px] border-white/70 rounded-full aspect-square"
          style={{ width: '92%', top: '2%' }}
        />

        {/* Key / paint area */}
        <div
          className="absolute left-1/2 -translate-x-1/2 border-[3px] border-white/70 bg-amber-500/20"
          style={{ width: '44%', height: '38%', top: '2%' }}
        >
          {/* Free throw line */}
          <div className="absolute inset-x-0 bottom-1/2 border-t-[3px] border-white/70" />
        </div>

        {/* Free throw circle (dashed upper half) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 border-[3px] border-dashed border-white/70 rounded-full aspect-square"
          style={{ width: '44%', top: '22%' }}
        />

        {/* Hoop / backboard */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: '1%' }}>
          <div className="w-20 h-5 bg-slate-700/80 rounded-sm" />
          <div className="w-16 h-12 border-2 border-orange-600 rounded-b-full mt-0.5" />
        </div>
      </div>

      {/* Position dots */}
      {POSITIONS.map((pos) => {
        const topName = topNames[pos.id];
        const active = activePos === pos.id;
        return (
          <button
            key={pos.id}
            onClick={() => onSelect(pos.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-90 ${
              active
                ? 'bg-white text-orange-700 ring-4 ring-orange-400 scale-110 z-10'
                : 'bg-slate-800/85 text-white hover:bg-slate-700'
            }`}
            style={{
              top: pos.top,
              left: pos.left,
              width: '68px',
              height: '68px',
            }}
          >
            <span className="text-2xl font-black leading-none">{pos.number}</span>
            <span className="text-[10px] leading-none mt-0.5 opacity-90">{pos.name}</span>
            <span className="text-[9px] leading-none mt-0.5 opacity-70">{pos.abbr}</span>
            {topName && (
              <span className="absolute bottom-full -mb-0.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
                <span className="relative z-10 px-3.5 py-1.5 bg-red-500 text-white text-base font-bold rounded-full border-2 border-white shadow-lg whitespace-nowrap">
                  {topName}
                </span>
                <span className="w-3 h-3 bg-red-500 border-b-2 border-r-2 border-white rotate-45 -mt-2" />
              </span>
            )}
          </button>
        );
      })}

      {/* Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-700/60 text-xs font-medium">
        点击位置查看排名
      </div>
    </div>
  );
}

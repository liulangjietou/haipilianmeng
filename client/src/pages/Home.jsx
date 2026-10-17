import { useState, useEffect } from 'react';
import api from '../api';
import CourtSelector from '../components/CourtSelector';
import PositionTable from '../components/PositionTable';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePos, setActivePos] = useState(5);

  const fetchData = async () => {
    try {
      const { data: result } = await api.get('/results');
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const topNames = {};
  if (data?.rankings) {
    for (const posId in data.rankings) {
      const top = data.rankings[posId][0];
      if (top) topNames[posId] = top.candidate.nickname || top.candidate.name;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  const positions = data?.positions || [];

  return (
    <div>
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-extrabold">
          <span className="bg-gradient-to-r from-court-300 via-court-400 to-amber-300 bg-clip-text text-transparent">
            嗨皮联盟实时排行榜
          </span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">每10秒自动刷新 · 点击球场或位置查看排名</p>
      </div>

      <CourtSelector activePos={activePos} onSelect={setActivePos} topNames={topNames} />

      <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <div className="flex min-w-max gap-2">
          {positions.map((pos) => (
            <button
              key={pos.id}
              onClick={() => setActivePos(pos.id)}
              className={`chip ${activePos === pos.id ? 'chip-active' : ''}`}
            >
              <span className="font-bold">{pos.id}</span>
              {pos.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <PositionTable positionId={activePos} rankings={data?.rankings?.[activePos]} />
      </div>
    </div>
  );
}

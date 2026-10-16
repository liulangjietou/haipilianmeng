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

  return (
    <div>
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold mb-1">
          <span className="bg-gradient-to-r from-court-400 to-amber-400 bg-clip-text text-transparent">
            嗨皮联盟实时排行榜
          </span>
        </h1>
        <p className="text-slate-400 text-xs">每10秒自动刷新</p>
      </div>

      <CourtSelector activePos={activePos} onSelect={setActivePos} topNames={topNames} />

      <div className="mt-6">
        <PositionTable positionId={activePos} rankings={data?.rankings?.[activePos]} />
      </div>
    </div>
  );
}

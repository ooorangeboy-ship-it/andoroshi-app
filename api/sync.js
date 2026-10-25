<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>andoroshi — Live Trend & Market Intelligence</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    body { font-family: 'Pretendard', sans-serif; background-color: #F2F1ED; color: #292824; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  </style>
</head>
<body class="bg-[#F2F1ED] text-[#292824]">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;

    function App() {
      const [liveData, setLiveData] = useState(null);
      const [loading, setLoading] = useState(false);
      const [keyword, setKeyword] = useState('식물성 멜라토닌 구미');
      const [lastSync, setLastSync] = useState('대기 중');

      // 실시간 Vercel 백엔드 API 호출 함수
      const fetchLiveSync = async (searchWord) => {
        setLoading(true);
        try {
          const res = await fetch(`/api/sync?keyword=${encodeURIComponent(searchWord || keyword)}`);
          const data = await res.json();
          if (data.success) {
            setLiveData(data.item);
            setLastSync(data.syncedAt);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchLiveSync('식물성 멜라토닌 구미');
      }, []);

      return (
        <div className="min-h-screen bg-[#F2F1ED] text-[#292824] p-6 max-w-4xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-[#D5CFC4] gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                ando<span className="text-[#866143]">roshi</span> <span className="text-xs bg-[#866143] text-[#F2F1ED] px-2 py-0.5 rounded ml-2">LIVE PRO</span>
              </h1>
              <p className="text-xs text-[#292824]/70 mt-1">네이버 쇼핑 API & Gemini AI 실시간 시장조사 엔진 가동 중</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={keyword} 
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="조사할 키워드 입력..."
                className="bg-[#EAE6DF] border border-[#D5CFC4] rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
              <button 
                onClick={() => fetchLiveSync(keyword)}
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-[#866143] text-[#F2F1ED] text-xs font-bold"
              >
                {loading ? 'AI 분석 중...' : '↻ 실시간 동기화'}
              </button>
            </div>
          </header>

          {loading && (
            <div className="text-center py-20 text-sm font-bold text-[#866143]">
              네이버 실시간 상품을 긁어오고 제미나이(Gemini)가 리뷰 빈틈과 대본을 분석하는 중입니다... 잠시만요! 🚀
            </div>
          )}

          {!loading && liveData && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <div className="text-xs font-extrabold text-[#866143] mb-1">{liveData.memeTag}</div>
                <h2 className="text-xl font-extrabold mb-2">{liveData.thumbnailTitle}</h2>
                <p className="text-xs text-[#292824]/80 mb-4">{liveData.thumbnailSub}</p>
                <div className="text-[11px] font-bold text-[#866143]">마지막 동기화 시각: {lastSync}</div>
              </div>

              {/* 네이버 실시간 쇼핑 랭킹 매칭 */}
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <h3 className="text-sm font-extrabold mb-4 text-[#866143]">{liveData.platformRankingTitle}</h3>
                <div className="space-y-2">
                  {liveData.rankings.map((r) => (
                    <div key={r.rank} className="p-3 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-extrabold text-[#866143] mr-2">{r.rank}위</span>
                        <span className="font-bold">{r.name}</span>
                      </div>
                      <span className="font-extrabold text-[#866143]">{r.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gemini AI 리뷰 빈틈(VOC) 분석 */}
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <h3 className="text-sm font-extrabold mb-4 text-[#866143]">Gemini AI 리뷰 불만 빈틈 분석 (VOC)</h3>
                <div className="space-y-3">
                  {liveData.vocPainPoints.map((v, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4]">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>불만 포인트 #{i+1}</span>
                        <span className="text-[#866143]">언급 비중 {v.ratio}%</span>
                      </div>
                      <p className="text-xs font-extrabold">“{v.issue}”</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 숏폼 대본 */}
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <h3 className="text-sm font-extrabold mb-3 text-[#866143]">채널별 맞춤형 AI 대본 & 전략</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4]">
                    <span className="font-bold text-[#866143] block mb-1">인스타 릴스 대본</span>
                    {liveData.channelScripts.reels}
                  </div>
                  <div className="p-3 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4]">
                    <span className="font-bold text-[#866143] block mb-1">유튜브 쇼츠 대본</span>
                    {liveData.channelScripts.youtube}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>

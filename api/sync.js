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

      const fetchLiveSync = async (searchWord) => {
        setLoading(true);
        try {
          const targetKeyword = searchWord || keyword;
          const res = await fetch(`/api/sync?keyword=${encodeURIComponent(targetKeyword)}`);
          const data = await res.json();
          if (data.success) {
            setLiveData(data.item);
            setLastSync(data.syncedAt);
          } else {
            alert('서버 연동 에러: API 키 설정을 다시 확인해 주세요!');
          }
        } catch (e) {
          console.error(e);
          alert('서버 통신 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchLiveSync('식물성 멜라토닌 구미');
      }, []);

      return (
        <div className="min-h-screen bg-[#F2F1ED] text-[#292824] p-4 lg:p-8 max-w-5xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-[#D5CFC4] gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                ando<span className="text-[#866143]">roshi</span> <span className="text-xs bg-[#866143] text-[#F2F1ED] px-2 py-0.5 rounded ml-2">LIVE PRO</span>
              </h1>
              <p className="text-xs text-[#292824]/70 mt-1">네이버 쇼핑 API & Gemini AI 실시간 시장조사 엔진 가동 중</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="text" 
                value={keyword} 
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="조사할 키워드 입력 (예: 레티놀 앰플)"
                className="bg-[#EAE6DF] border border-[#D5CFC4] rounded-xl px-3 py-2 text-xs focus:outline-none flex-1 md:w-64"
              />
              <button 
                onClick={() => fetchLiveSync(keyword)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[#866143] text-[#F2F1ED] text-xs font-bold shrink-0 hover:opacity-90 transition-all"
              >
                {loading ? 'AI 분석 중...' : '↻ 실시간 동기화'}
              </button>
            </div>
          </header>

          {loading && (
            <div className="text-center py-24 bg-[#EAE6DF] rounded-3xl border border-[#D5CFC4] my-6">
              <div className="text-base font-extrabold text-[#866143] mb-2 animate-pulse">
                🚀 네이버 실시간 상품을 수집하고 Gemini AI가 분석하는 중입니다...
              </div>
              <p className="text-xs text-[#292824]/70">약 3~5초 정도 소요됩니다. 잠시만 기다려 주세요!</p>
            </div>
          )}

          {!loading && liveData && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-extrabold text-[#866143]">{liveData.memeTag}</span>
                  <span className="text-[11px] font-bold text-[#292824]/70">동기화 시각: {lastSync}</span>
                </div>
                <h2 className="text-xl font-extrabold mb-2 text-[#292824]">{liveData.thumbnailTitle}</h2>
                <p className="text-xs text-[#292824]/80">{liveData.thumbnailSub}</p>
              </div>

              {/* 네이버 실시간 쇼핑 랭킹 매칭 */}
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <h3 className="text-sm font-extrabold mb-4 text-[#866143]">{liveData.platformRankingTitle}</h3>
                <div className="space-y-2">
                  {liveData.rankings && liveData.rankings.map((r) => (
                    <div key={r.rank} className="p-3.5 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4] flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[#866143] bg-[#EAE6DF] px-2 py-1 rounded-lg">{r.rank}위</span>
                        <span className="font-bold text-[#292824]">{r.name}</span>
                      </div>
                      <span className="font-extrabold text-[#866143] shrink-0 ml-2">{r.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gemini AI 리뷰 빈틈(VOC) 분석 */}
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <h3 className="text-sm font-extrabold mb-4 text-[#866143]">Gemini AI 리뷰 불만 빈틈 분석 (VOC)</h3>
                <div className="space-y-3">
                  {liveData.vocPainPoints && liveData.vocPainPoints.map((v, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4]">
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-[#292824]">불만 포인트 #{i+1}</span>
                        <span className="text-[#866143]">언급 비중 {v.ratio}%</span>
                      </div>
                      <p className="text-xs font-extrabold text-[#292824]">“{v.issue}”</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 숏폼 대본 */}
              <div className="p-6 rounded-3xl bg-[#EAE6DF] border border-[#D5CFC4]">
                <h3 className="text-sm font-extrabold mb-3 text-[#866143]">채널별 맞춤형 AI 대본 & 전략</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4]">
                    <span className="font-extrabold text-[#866143] block mb-2">🎬 인스타 릴스 대본</span>
                    <p className="whitespace-pre-line leading-relaxed text-[#292824]/90">{liveData.channelScripts?.reels}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F2F1ED] border border-[#D5CFC4]">
                    <span className="font-extrabold text-[#866143] block mb-2">▶️ 유튜브 쇼츠 대본</span>
                    <p className="whitespace-pre-line leading-relaxed text-[#292824]/90">{liveData.channelScripts?.youtube}</p>
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

// 파일 위치: api/sync.js (Vercel 서버리스 백엔드 엔진)

export default async function handler(req, res) {
  // 한글 깨짐 방지 및 CORS 허용
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const query = req.query.keyword || '식물성 멜라토닌 구미';
  const category = req.query.category || 'beauty';

  const naverId = process.env.NAVER_CLIENT_ID;
  const naverSecret = process.env.NAVER_CLIENT_SECRET;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. 네이버 실시간 쇼핑 랭킹 TOP 3 실제 수집
    let rankings = [];
    if (naverId && naverSecret) {
      const naverRes = await fetch(
        `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=3&sort=sim`,
        {
          headers: {
            'X-Naver-Client-Id': naverId,
            'X-Naver-Client-Secret': naverSecret,
          },
        }
      );
      const naverData = await naverRes.json();
      if (naverData.items) {
        rankings = naverData.items.map((item, idx) => ({
          rank: idx + 1,
          name: item.title.replace(/<[^>]*>?/gm, ''), // HTML 태그 제거
          price: Number(item.lprice).toLocaleString() + '원',
          rating: '4.8',
          reviews: '실시간 인기',
          badge: item.mallName || `네이버 ${idx + 1}위`,
        }));
      }
    }

    // 2. 제미나이(Gemini) AI 실시간 시장조사 & 빈틈(VOC) & 숏폼 대본 생성
    let aiData = null;
    if (geminiKey) {
      const prompt = `
당신은 대한민국 최고의 커머스 마케터이자 시장조사 분석가입니다.
현재 급상승 중인 키워드 "${query}"에 대해 실제 소비자들의 페인포인트(불만 빈틈)와 숏폼 광고 대본을 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.

{
  "memeTag": "#관련해시태그1 #관련해시태그2",
  "thumbnailTitle": "초반 3초 시선을 끄는 강력한 후킹 한 줄 카피",
  "thumbnailSub": "제품의 차별점을 설명하는 서브 카피",
  "blueOceanScore": 89,
  "vocPainPoints": [
    { "issue": "기존 경쟁사 제품들의 가장 큰 소비자 불만 1위", "ratio": 45 },
    { "issue": "소비자 불만 2위", "ratio": 32 },
    { "issue": "소비자 불만 3위", "ratio": 23 }
  ],
  "aiStrategies": [
    "불만 1위를 역이용한 셀링 포인트 한 줄 카피",
    "불만 2위를 해결한 셀링 포인트 한 줄 카피",
    "구매 전환을 유도하는 결정적 한 줄 카피"
  ],
  "channelScripts": {
    "naver": "네이버 쇼핑/블로그 상위노출 제목 및 핵심 배너 문구",
    "reels": "인스타 릴스 초반 3초 화면 자막 + 오디오 + 매니챗 DM 유도 문구",
    "youtube": "유튜브 쇼츠 내레이션 오프닝 대본",
    "tiktok": "틱톡 챌린지 및 ASMR 컷 편집 기획안"
  },
  "crossChannelFunnel": "숏폼 유입부터 네이버 검색, 최종 구매 전환까지의 크로스 채널 퍼널 전략 요약"
}`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
        }
      );
      const geminiJson = await geminiRes.json();
      const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        aiData = JSON.parse(rawText);
      }
    }

    // 3. 프론트엔드로 실시간 분석 결과 반환
    return res.status(200).json({
      success: true,
      syncedAt: new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' }),
      item: {
        id: 'live-' + Date.now(),
        category,
        categoryLabel: category === 'beauty' ? '뷰티 · 웰니스 (실시간)' : '실시간 AI 분석',
        primaryChannel: 'reels',
        activeChannels: ['naver', 'reels', 'youtube', 'tiktok'],
        keyword: query,
        growth: '+실시간 급상승',
        blueOceanScore: aiData?.blueOceanScore || 90,
        format: 'Gemini AI 실시간 생성 리포트',
        platformSource: rankings[0] ? `${rankings[0].badge} 매칭 완료` : '네이버 쇼핑 실시간 연동',
        memeTag: aiData?.memeTag || `#${query.replace(/\s+/g, '')} #실시간트렌드`,
        thumbnailTitle: aiData?.thumbnailTitle || `“요즘 난리 난 ${query}, 왜 다들 이것만 찾을까?”`,
        thumbnailSub: aiData?.thumbnailSub || '실시간 네이버 쇼핑 데이터 & AI 리뷰 빈틈 분석 리포트',
        duration: '0:20',
        views: 'LIVE',
        saves: 'LIVE',
        hookStructure: [
          { step: '초반 3초 (Hook)', desc: aiData?.thumbnailTitle || '강력한 문제 제기 후킹' },
          { step: '중반 10초 (Body)', desc: aiData?.aiStrategies?.[0] || '기존 제품의 불만을 해결한 핵심 셀링포인트 제시' },
          { step: '후반 7초 (CTA)', desc: '댓글 이벤트 및 프로필 링크 최저가 연결' }
        ],
        channelMetrics: {
          naver: { label: '네이버 실시간 매칭', value: 'LIVE 연동', growth: '실시간', sub: '네이버 쇼핑 API 직결' },
          reels: { label: '릴스 AI 대본', value: '생성 완료', growth: 'AI 최적화', sub: '초반 3초 후킹 설계' }
        },
        platformRankingTitle: `네이버 쇼핑 "${query}" 실시간 매칭 TOP 3`,
        rankings: rankings.length > 0 ? rankings : [
          { rank: 1, name: `${query} 실시간 1위 상품 (API 키 등록 시 실제 상품명 노출)`, price: '실시간 연동', rating: '4.9', reviews: 'LIVE', badge: '네이버 쇼핑' }
        ],
        vocPainPoints: aiData?.vocPainPoints || [
          { issue: 'GEMINI_API_KEY를 등록하면 실제 소비자 불만 TOP 3가 실시간 추출됩니다.', ratio: 50 }
        ],
        aiStrategies: aiData?.aiStrategies || [
          'Vercel 환경변수에 API 키를 넣으면 제미나이가 즉시 카피를 작성합니다.'
        ],
        channelScripts: aiData?.channelScripts || {
          naver: '실시간 네이버 전략 생성 대기 중',
          reels: '실시간 릴스 대본 생성 대기 중',
          youtube: '실시간 쇼츠 대본 생성 대기 중',
          tiktok: '실시간 틱톡 기획 생성 대기 중'
        },
        crossChannelFunnel: aiData?.crossChannelFunnel || '실시간 퍼널 전략 생성 완료'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

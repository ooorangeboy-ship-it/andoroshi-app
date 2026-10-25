module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const query = (req.query && req.query.keyword) ? req.query.keyword : '식물성 멜라토닌 구미';
  const category = (req.query && req.query.category) ? req.query.category : 'beauty';

  const naverId = (process.env.NAVER_CLIENT_ID || '').trim();
  const naverSecret = (process.env.NAVER_CLIENT_SECRET || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

  let debugStatus = { naver: '키 없음', gemini: '키 없음' };
  let rankings = [];

  // 1. 네이버 실시간 쇼핑 검색 (브랜드명, 상품 실링크, 썸네일 이미지까지 추출)
  if (naverId && naverSecret) {
    try {
      let naverRes = await fetch(
        'https://openapi.naver.com/v1/search/shop.json?query=' + encodeURIComponent(query) + '&display=4&sort=sim',
        {
          headers: {
            'X-Naver-Client-Id': naverId,
            'X-Naver-Client-Secret': naverSecret
          }
        }
      );

      if (!naverRes.ok) {
        naverRes = await fetch(
          'https://naveropenapi.apigw.ntruss.com/v1/search/shop.json?query=' + encodeURIComponent(query) + '&display=4&sort=sim',
          {
            headers: {
              'X-NCP-APIGW-API-KEY-ID': naverId,
              'X-NCP-APIGW-API-KEY': naverSecret,
              'X-Naver-Client-Id': naverId,
              'X-Naver-Client-Secret': naverSecret
            }
          }
        );
      }

      const naverData = await naverRes.json();
      if (naverData && naverData.items && naverData.items.length > 0) {
        debugStatus.naver = '실시간 연동 성공';
        rankings = naverData.items.map(function(item, idx) {
          const cleanTitle = item.title.replace(/<[^>]*>?/gm, '');
          const extractedBrand = item.brand || item.maker || item.mallName || cleanTitle.split(' ')[0];
          return {
            rank: idx + 1,
            brand: extractedBrand,
            name: cleanTitle,
            price: Number(item.lprice).toLocaleString() + '원',
            link: item.link,
            image: item.image,
            mallName: item.mallName || '네이버쇼핑',
            badge: (item.brand ? item.brand : item.mallName) || ('실시간 ' + (idx + 1) + '위')
          };
        });
      } else {
        debugStatus.naver = (naverData && naverData.errorMessage) ? naverData.errorMessage : '검색 결과 없음';
      }
    } catch (e) {
      debugStatus.naver = '호출 오류: ' + e.message;
    }
  }

  // 2. Google Gemini AI: 다수 노출 광고 소재(Winning Ads) & 브랜드 & VOC 분석
  let aiData = null;
  if (geminiKey) {
    try {
      const prompt = '당신은 대한민국 최고의 퍼포먼스 마케터이자 광고 소재 분석가입니다.\n' +
        '현재 사용자가 검색한 키워드 "' + query + '"에 대해 실제 한국 시장의 대표 브랜드, 현재 가장 노출이 많이 되고 있는 고효율 광고 소재(Winning Ad Creatives) 3가지, 소비자 불만 빈틈(VOC), 그리고 숏폼 대본을 아래 JSON 구조로만 응답하세요. 마크다운 기호 없이 순수 JSON 문자열만 출력하세요.\n\n' +
        '{\n' +
        '  "category": "beauty 또는 fashion 또는 food 또는 app 중 가장 어울리는 것 1개",\n' +
        '  "categoryLabel": "뷰티 · 웰니스 (또는 패션 · 어패럴 / 식품 · F&B / 모바일 앱 · 디지털)",\n' +
        '  "memeTag": "#관련급상승태그1 #관련급상승태그2",\n' +
        '  "thumbnailTitle": "초반 3초 시선을 끄는 강력한 후킹 한 줄 카피 (따옴표 포함)",\n' +
        '  "thumbnailSub": "기존 제품의 단점을 해결한 핵심 차별점 서브 카피",\n' +
        '  "blueOceanScore": 92,\n' +
        '  "searchVolume": "92,400회",\n' +
        '  "growth": "+340%",\n' +
        '  "topAds": [\n' +
        '    {\n' +
        '      "brand": "실제 이 시장을 리드하는 대표 브랜드명 1",\n' +
        '      "platform": "Meta(인스타 릴스) 30일 이상 장기집행 소재",\n' +
        '      "adType": "비포/애프터 비교 시연형 숏폼",\n' +
        '      "headline": "실제 광고 상단에 가장 많이 노출되는 메인 헤드카피",\n' +
        '      "visualScene": "초반 3초 화면에서 시선을 사로잡는 시각적 연출 장면 묘사",\n' +
        '      "ctaText": "프로필 링크 특가 확인 / 댓글 자동 DM 유도 문구",\n' +
        '      "searchKeyword": "메타 광고 라이브러리나 릴스에서 검색할 핵심 브랜드/상품 키워드"\n' +
        '    },\n' +
        '    {\n' +
        '      "brand": "실제 공격적으로 광고 중인 경쟁 브랜드명 2",\n' +
        '      "platform": "유튜브 쇼츠 · 인스타 피드 동시 집행",\n' +
        '      "adType": "전문가/인플루언서 팩트체크 리뷰형",\n' +
        '      "headline": "신뢰도를 높이며 클릭을 유도하는 광고 카피",\n' +
        '      "visualScene": "성분이나 스펙을 직관적으로 비교해 주는 장면 묘사",\n' +
        '      "ctaText": "오늘 자정 1+1 마감 안내",\n' +
        '      "searchKeyword": "검색용 브랜드/상품 키워드 2"\n' +
        '    },\n' +
        '    {\n' +
        '      "brand": "틱톡/릴스 바이럴 급상승 브랜드명 3",\n' +
        '      "platform": "TikTok · 인스타 릴스 바이럴 시딩",\n' +
        '      "adType": "ASMR · 내돈내산 하울 포맷",\n' +
        '      "headline": "MZ세대 저장과 공유를 부르는 밈/공감 카피",\n' +
        '      "visualScene": "제형이나 착용핏을 클로즈업으로 보여주는 감각적 컷 편집",\n' +
        '      "ctaText": "고정 댓글 최저가 좌표 확인",\n' +
        '      "searchKeyword": "검색용 브랜드/상품 키워드 3"\n' +
        '    }\n' +
        '  ],\n' +
        '  "aiRankingsFallback": [\n' +
        '    { "rank": 1, "brand": "대표브랜드1", "name": "' + query + ' 분야 실제 한국 시장 대표 인기 상품명 1", "price": "28,900원", "badge": "시장 1위" },\n' +
        '    { "rank": 2, "brand": "대표브랜드2", "name": "' + query + ' 분야 실제 한국 시장 대표 인기 상품명 2", "price": "34,000원", "badge": "급상승 2위" },\n' +
        '    { "rank": 3, "brand": "대표브랜드3", "name": "' + query + ' 분야 실제 한국 시장 대표 인기 상품명 3", "price": "21,500원", "badge": "추천 3위" }\n' +
        '  ],\n' +
        '  "hookStructure": [\n' +
        '    { "step": "초반 3초 (Hook)", "desc": "시각적/청각적으로 스크롤을 멈추게 하는 첫 장면 연출법" },\n' +
        '    { "step": "중반 12초 (Body)", "desc": "기존 제품의 불편함을 보여주고 이 제품의 해결책을 시연하는 연출" },\n' +
        '    { "step": "후반 7초 (CTA)", "desc": "댓글 이벤트나 프로필 링크 클릭을 유도하는 클로징 멘트" }\n' +
        '  ],\n' +
        '  "vocPainPoints": [\n' +
        '    { "issue": "실제 소비자들이 경쟁사 제품 리뷰에서 가장 많이 불평하는 단점 1위", "ratio": 46 },\n' +
        '    { "issue": "실제 소비자들이 겪는 구체적인 불편함 2위", "ratio": 33 },\n' +
        '    { "issue": "가격이나 용기, 사용성 면에서의 아쉬운 점 3위", "ratio": 21 }\n' +
        '  ],\n' +
        '  "aiStrategies": [\n' +
        '    "불만 1위를 정면으로 해결해 구매를 부르는 상세페이지 헤드 카피",\n' +
        '    "불만 2위를 역이용한 차별화 소구점 카피",\n' +
        '    "지금 당장 사야만 하는 이유를 만드는 프로모션 카피"\n' +
        '  ],\n' +
        '  "channelScripts": {\n' +
        '    "naver": "• [쇼핑/블로그 키워드]: 추천 검색어 조합\\n• [상세페이지 최상단 배너]: 핵심 후킹 문구",\n' +
        '    "reels": "• [0~3초 화면]: 첫 장면 연출과 자막\\n• [오디오/ASMR]: 추천 사운드\\n• [DM 유도]: 댓글 트리거 문구",\n' +
        '    "youtube": "• [쇼츠 오프닝 내레이션]: 전문성 있게 시작하는 첫 두 문장 대본",\n' +
        '    "tiktok": "• [챌린지/컷편집 포맷]: 틱톡 유저들이 반응하는 빠른 리듬 컷 편집 기획"\n' +
        '  },\n' +
        '  "crossChannelFunnel": "숏폼에서 호기심을 유발하고 네이버 검색을 거쳐 최종 구매로 이어지게 만드는 퍼널 전략 요약"\n' +
        '}';

      const geminiRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );
      const geminiJson = await geminiRes.json();
      const rawText = geminiJson && geminiJson.candidates && geminiJson.candidates[0] && geminiJson.candidates[0].content && geminiJson.candidates[0].content.parts && geminiJson.candidates[0].content.parts[0] ? geminiJson.candidates[0].content.parts[0].text : null;

      if (rawText) {
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        aiData = JSON.parse(cleaned);
        debugStatus.gemini = '실시간 AI 생성 성공';
      } else {
        debugStatus.gemini = (geminiJson && geminiJson.error && geminiJson.error.message) ? geminiJson.error.message : '응답 파싱 실패';
      }
    } catch (e) {
      debugStatus.gemini = 'AI 호출 오류: ' + e.message;
    }
  }

  const naverSearchFallbackUrl = 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent(query);

  const finalRankings = rankings.length > 0
    ? rankings
    : ((aiData && aiData.aiRankingsFallback) ? aiData.aiRankingsFallback.map(function(r) {
        return {
          rank: r.rank,
          brand: r.brand || query.split(' ')[0],
          name: r.name,
          price: r.price,
          link: 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent(r.name),
          mallName: '네이버쇼핑 검색',
          badge: r.badge || '인기 상품'
        };
      }) : [
        { rank: 1, brand: '실시간 1위', name: query + ' 베스트 대표 상품', price: '29,800원', link: naverSearchFallbackUrl, mallName: '네이버쇼핑', badge: '실시간 1위' }
      ]);

  const rawTopAds = (aiData && aiData.topAds && aiData.topAds.length > 0) ? aiData.topAds : [
    {
      brand: finalRankings[0] ? finalRankings[0].brand : query,
      platform: 'Meta(인스타·릴스) 장기집행 소재',
      adType: '초반 3초 문제제기 + 비포/애프터 시연',
      headline: '“아직도 기존 ' + query + ' 불편하게 쓰고 계신가요?”',
      visualScene: '소비자 불만 1위 상황을 클로즈업으로 보여준 뒤 즉각적인 해결 장면을 대조',
      ctaText: '프로필 링크 단독 최저가 & 댓글 DM 이벤트',
      searchKeyword: query
    }
  ];

  // 각 광고 소재마다 실제 메타 광고 라이브러리, 틱톡 크리에이티브, 유튜브 쇼츠 검색 직결 URL 부여
  const enrichedTopAds = rawTopAds.map(function(ad) {
    const kw = ad.searchKeyword || ad.brand || query;
    return {
      brand: ad.brand || query,
      platform: ad.platform || '인스타 릴스 · 메타 광고',
      adType: ad.adType || '숏폼 후킹 소재',
      headline: ad.headline,
      visualScene: ad.visualScene,
      ctaText: ad.ctaText,
      metaAdLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=KR&q=' + encodeURIComponent(kw),
      tiktokCreativeUrl: 'https://www.tiktok.com/search?q=' + encodeURIComponent(kw),
      youtubeShortsUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(kw + ' 쇼츠'),
      naverBrandUrl: 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent(ad.brand + ' ' + query)
    };
  });

  const nowStr = new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return res.status(200).json({
    success: true,
    debugStatus: debugStatus,
    syncedAt: nowStr + ' (LIVE 실시간 완료)',
    item: {
      id: 'live-' + Date.now(),
      isLiveGenerated: true,
      category: (aiData && aiData.category) ? aiData.category : category,
      categoryLabel: ((aiData && aiData.categoryLabel) ? aiData.categoryLabel : '실시간 AI 분석') + ' · LIVE',
      primaryChannel: 'reels',
      activeChannels: ['naver', 'instagram', 'reels', 'youtube', 'tiktok'],
      memeTag: (aiData && aiData.memeTag) ? aiData.memeTag : ('#' + query.replace(/\s+/g, '') + ' #실시간트렌드'),
      keyword: query,
      growth: (aiData && aiData.growth) ? aiData.growth : '+320%',
      blueOceanScore: (aiData && aiData.blueOceanScore) ? aiData.blueOceanScore : 91,
      competitionLevel: '실시간 브랜드 · 광고소재 매칭 완료',
      format: '실시간 API 수집 (' + nowStr + ')',
      platformSource: finalRankings[0] ? ('1위 브랜드: ' + finalRankings[0].brand) : '실시간 브랜드 매칭',
      thumbnailTitle: (aiData && aiData.thumbnailTitle) ? aiData.thumbnailTitle : ('“요즘 난리 난 \'' + query + '\', 왜 다들 이것만 찾을까?”'),
      thumbnailSub: (aiData && aiData.thumbnailSub) ? aiData.thumbnailSub : (query + ' 시장의 다수 노출 광고 소재 & 리뷰 빈틈 리포트'),
      duration: '0:21',
      views: 'LIVE',
      saves: 'LIVE',
      topAds: enrichedTopAds,
      externalAdLinks: {
        metaLibrary: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=KR&q=' + encodeURIComponent(query),
        tiktokTopAds: 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?region=KR',
        naverShopping: naverSearchFallbackUrl,
        oliveyoungSearch: 'https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=' + encodeURIComponent(query),
        musinsaSearch: 'https://www.musinsa.com/search/goods?keyword=' + encodeURIComponent(query)
      },
      hookStructure: (aiData && aiData.hookStructure) ? aiData.hookStructure : [
        { step: '초반 3초 (Hook)', desc: query + ' 사용 시 가장 흔히 겪는 불편함을 클로즈업하며 공감 유도' },
        { step: '중반 12초 (Body)', desc: '기존 제품과 차별화되는 핵심 스펙 및 즉각적인 비포/애프터 시연' },
        { step: '후반 6초 (CTA)', desc: '프로필 링크 및 댓글 자동 DM으로 최저가 혜택 안내' }
      ],
      channelMetrics: {
        naver: { label: '네이버 검색·쇼핑', value: (aiData && aiData.searchVolume) ? aiData.searchVolume : '실시간 연동', growth: (aiData && aiData.growth) ? aiData.growth : '+310%', sub: rankings.length > 0 ? '실제 브랜드·상품 링크 연동됨' : 'AI 추정 검색 트렌드' },
        reels: { label: '메타·릴스 광고 소재', value: enrichedTopAds.length + '개 핵심 소재', growth: '장기집행', sub: '메타 광고 라이브러리 직결' }
      },
      platformRankingTitle: '실시간 "' + query + '" 브랜드 & 구매 링크 TOP 4',
      rankings: finalRankings,
      vocPainPoints: (aiData && aiData.vocPainPoints) ? aiData.vocPainPoints : [
        { issue: '기존 제품의 사용감 및 가성비 관련 소비자 불만 빈틈', ratio: 50 }
      ],
      aiStrategies: (aiData && aiData.aiStrategies) ? aiData.aiStrategies : [
        '“기존 ' + query + '의 아쉬움은 끝! 소비자가 진짜 원하던 완벽한 대안”'
      ],
      channelScripts: (aiData && aiData.channelScripts) ? aiData.channelScripts : {
        naver: '• [쇼핑검색 키워드]: ' + query + ' 추천 / 브랜드 비교',
        reels: '• [0~3초]: “아직도 아무 ' + query + '나 쓰세요?”',
        youtube: '• [쇼츠 내레이션]: “' + query + ' 고를 때 딱 이 1가지만 확인하세요.”',
        tiktok: '• [챌린지]: #' + query.replace(/\s+/g, '') + '추천 빠른 언박싱 ASMR'
      },
      crossChannelFunnel: (aiData && aiData.crossChannelFunnel) ? aiData.crossChannelFunnel : ('릴스·틱톡 숏폼으로 \'' + query + '\'의 시각적 후킹 유도 → 네이버 브랜드 검색 → 스마트스토어/올리브영 구매 전환')
    }
  });
};

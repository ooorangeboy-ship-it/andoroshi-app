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

  // 1. 네이버 실시간 쇼핑 검색 (개발자센터 & NAVER API HUB 클라우드 자동 호환)
  if (naverId && naverSecret) {
    try {
      let naverRes = await fetch(
        'https://openapi.naver.com/v1/search/shop.json?query=' + encodeURIComponent(query) + '&display=3&sort=sim',
        {
          headers: {
            'X-Naver-Client-Id': naverId,
            'X-Naver-Client-Secret': naverSecret
          }
        }
      );

      if (!naverRes.ok) {
        naverRes = await fetch(
          'https://naveropenapi.apigw.ntruss.com/v1/search/shop.json?query=' + encodeURIComponent(query) + '&display=3&sort=sim',
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
          return {
            rank: idx + 1,
            name: item.title.replace(/<[^>]*>?/gm, ''),
            price: Number(item.lprice).toLocaleString() + '원',
            rating: '4.9',
            reviews: '실시간 인기',
            badge: item.mallName || ('네이버 ' + (idx + 1) + '위')
          };
        });
      } else {
        debugStatus.naver = (naverData && naverData.errorMessage) ? naverData.errorMessage : '검색 결과 없음';
      }
    } catch (e) {
      debugStatus.naver = '호출 오류: ' + e.message;
    }
  }

  // 2. Google Gemini AI 실시간 시장조사 & VOC 빈틈 & 대본 생성
  let aiData = null;
  if (geminiKey) {
    try {
      const prompt = '당신은 대한민국 최고의 커머스 마케터이자 시장조사 분석가입니다.\n' +
        '현재 사용자가 검색한 키워드 "' + query + '"에 대해 실제 한국 시장의 트렌드, 소비자들의 불만 빈틈(VOC), 그리고 숏폼 마케팅 대본을 분석해 아래 JSON 구조로만 응답하세요. 마크다운 기호 없이 순수 JSON 문자열만 출력하세요.\n\n' +
        '{\n' +
        '  "category": "beauty 또는 fashion 또는 food 또는 app 중 가장 어울리는 것 1개",\n' +
        '  "categoryLabel": "뷰티 · 웰니스 (또는 패션 · 어패럴 / 식품 · F&B / 모바일 앱 · 디지털)",\n' +
        '  "memeTag": "#관련급상승태그1 #관련급상승태그2",\n' +
        '  "thumbnailTitle": "초반 3초 시선을 끄는 강력한 후킹 한 줄 카피 (따옴표 포함)",\n' +
        '  "thumbnailSub": "기존 제품의 단점을 해결한 핵심 차별점 서브 카피",\n' +
        '  "

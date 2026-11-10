// Official help for people from abroad living in or visiting Korea.
// Boundless is not affiliated with any of these. Links checked 2026-11-07.

export type Help = { name: string; desc: string; url?: string; tel?: string; topics: string[] };

export const HOTLINES: Help[] = [
  { name: "경찰", tel: "112", desc: "범죄·위급 상황. 통역을 연결해 줘요.", topics: [] },
  { name: "화재·구급", tel: "119", desc: "화재, 응급 환자. 통역을 연결해 줘요.", topics: ["health"] },
  { name: "외국인종합안내센터", tel: "1345", desc: "비자·체류·외국인등록 상담. 여러 언어로 안내해요.", topics: ["visa", "work"] },
  // Wage arrears are the most common problem on the work board; 132 (legal aid) alone was not enough.
  { name: "고용노동부 고객상담센터", tel: "1350", desc: "임금 체불, 근로 조건, 산업재해 상담.", topics: ["work"] },
  { name: "관광통역안내", tel: "1330", desc: "여행·교통 안내와 통역. 24시간, 여러 언어.", topics: ["transit", "trip", "popup"] },
  { name: "다누리콜센터", tel: "1577-1366", desc: "이주민·다문화가족 생활 상담과 긴급 지원. 여러 언어.", topics: ["chat", "housing"] },
  { name: "대한법률구조공단", tel: "132", desc: "임금 체불, 전세 사기 같은 법률 상담.", topics: ["housing", "work", "market"] },
];

export const SITES: Help[] = [
  { name: "하이코리아", url: "https://www.hikorea.go.kr", desc: "체류 연장, 외국인등록, 방문 예약 같은 출입국 전자민원.", topics: ["visa", "work"] },
  { name: "법무부 출입국·외국인정책본부", url: "https://www.immigration.go.kr", desc: "비자 종류, 제도 변경, 출입국 공지.", topics: ["visa", "work"] },
  { name: "다누리", url: "https://www.liveinkorea.kr", desc: "한국 생활 안내를 여러 언어로. 주거, 의료, 교육, 한국어 학습.", topics: ["chat", "housing", "health", "korean", "love"] },
  { name: "서울글로벌센터", url: "https://global.seoul.go.kr", desc: "서울 외국인 주민 상담, 생활 정보, 교육 프로그램.", topics: ["chat", "housing", "visa"] },
  { name: "국민건강보험공단", url: "https://www.nhis.or.kr", desc: "외국인 건강보험 가입, 보험료, 병원 이용.", topics: ["health"] },
  { name: "고용허가제(EPS)", url: "https://www.eps.go.kr", desc: "고용허가 근로자 취업, 사업장 변경, 상담.", topics: ["visa", "work"] },
  { name: "스터디 인 코리아", url: "https://www.studyinkorea.go.kr", desc: "유학생 입학, 장학금, 학교 생활 정보.", topics: ["visa", "work"] },
  { name: "대한민국 구석구석 (한국관광공사)", url: "https://english.visitkorea.or.kr", desc: "여행지, 교통, 축제, 관광 안내소 정보.", topics: ["trip", "popup", "food"] },
  { name: "코레일", url: "https://www.korail.com", desc: "KTX·기차 시간표와 예매.", topics: ["transit"] },
  { name: "코리아넷", url: "https://www.korea.net", desc: "정부가 여러 언어로 운영하는 한국 소개·뉴스 포털.", topics: [] },
  { name: "정부24", url: "https://www.gov.kr", desc: "주민센터 서류 발급 같은 행정 서비스. 외국인등록번호로 이용.", topics: ["visa", "housing"] },
];

export const APPS = [{ name: "안전디딤돌", desc: "재난 문자와 대피소 안내를 여러 언어로 받는 정부 앱." }];

export const helpFor = (topic: string) => [...HOTLINES, ...SITES].filter((h) => h.topics.includes(topic)).slice(0, 3);

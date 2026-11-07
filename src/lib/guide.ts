// Official help for people from abroad living in or visiting Korea.
// Boundless is not affiliated with any of these. Links checked 2026-11-07.

export type Help = { name: { ko: string; en: string }; desc: string; url?: string; tel?: string; topics: string[] };

export const HOTLINES: Help[] = [
  { name: { ko: "경찰", en: "Police" }, tel: "112", desc: "범죄·위급 상황. 통역을 연결해 줘요.", topics: [] },
  { name: { ko: "화재·구급", en: "Fire & ambulance" }, tel: "119", desc: "화재, 응급 환자. 통역을 연결해 줘요.", topics: ["health"] },
  { name: { ko: "외국인종합안내센터", en: "Immigration Contact Center" }, tel: "1345", desc: "비자·체류·외국인등록 상담. 여러 언어로 안내해요.", topics: ["procedures"] },
  { name: { ko: "관광통역안내", en: "Korea Travel Hotline" }, tel: "1330", desc: "여행·교통 안내와 통역. 24시간, 여러 언어.", topics: ["transit", "daily"] },
  { name: { ko: "다누리콜센터", en: "Danuri Helpline" }, tel: "1577-1366", desc: "이주민·다문화가족 생활 상담과 긴급 지원. 여러 언어.", topics: ["daily", "housing"] },
  { name: { ko: "대한법률구조공단", en: "Korea Legal Aid Corporation" }, tel: "132", desc: "임금 체불, 전세 사기 같은 법률 상담.", topics: ["housing", "procedures"] },
];

export const SITES: Help[] = [
  { name: { ko: "하이코리아", en: "HiKorea" }, url: "https://www.hikorea.go.kr", desc: "체류 연장, 외국인등록, 방문 예약 같은 출입국 전자민원.", topics: ["procedures"] },
  { name: { ko: "법무부 출입국·외국인정책본부", en: "Korea Immigration Service" }, url: "https://www.immigration.go.kr", desc: "비자 종류, 제도 변경, 출입국 공지.", topics: ["procedures"] },
  { name: { ko: "다누리", en: "Danuri" }, url: "https://www.liveinkorea.kr", desc: "한국 생활 안내를 여러 언어로. 주거, 의료, 교육, 한국어 학습.", topics: ["daily", "housing", "health"] },
  { name: { ko: "서울글로벌센터", en: "Seoul Global Center" }, url: "https://global.seoul.go.kr", desc: "서울 외국인 주민 상담, 생활 정보, 교육 프로그램.", topics: ["daily", "housing", "procedures"] },
  { name: { ko: "국민건강보험공단", en: "National Health Insurance Service" }, url: "https://www.nhis.or.kr", desc: "외국인 건강보험 가입, 보험료, 병원 이용.", topics: ["health"] },
  { name: { ko: "고용허가제(EPS)", en: "Employment Permit System (EPS)" }, url: "https://www.eps.go.kr", desc: "고용허가 근로자 취업, 사업장 변경, 상담.", topics: ["procedures"] },
  { name: { ko: "스터디 인 코리아", en: "Study in Korea" }, url: "https://www.studyinkorea.go.kr", desc: "유학생 입학, 장학금, 학교 생활 정보.", topics: ["procedures"] },
  { name: { ko: "대한민국 구석구석 (한국관광공사)", en: "VISITKOREA (Korea Tourism Organization)" }, url: "https://english.visitkorea.or.kr", desc: "여행지, 교통, 축제, 관광 안내소 정보.", topics: ["transit", "daily"] },
  { name: { ko: "코레일", en: "Korail" }, url: "https://www.korail.com", desc: "KTX·기차 시간표와 예매.", topics: ["transit"] },
  { name: { ko: "코리아넷", en: "Korea.net" }, url: "https://www.korea.net", desc: "정부가 여러 언어로 운영하는 한국 소개·뉴스 포털.", topics: [] },
  { name: { ko: "정부24", en: "Gov24" }, url: "https://www.gov.kr", desc: "주민센터 서류 발급 같은 행정 서비스. 외국인등록번호로 이용.", topics: ["procedures", "housing"] },
];

export const APPS = [{ name: { ko: "안전디딤돌", en: "Emergency Ready" }, desc: "재난 문자와 대피소 안내를 여러 언어로 받는 정부 앱." }];

export const helpFor = (topic: string) => [...HOTLINES, ...SITES].filter((h) => h.topics.includes(topic)).slice(0, 3);

// Boards: each is its own space with its own 말머리 (tags), hints and, for some, extra fields.
// Grouped the way life in Korea is lived: getting things done, enjoying it, and talking.
import type { IconName } from "@/components/Icon";

export type Tag = { id: string; ko: string; asks?: boolean }; // asks: a question that waits for answers
export type Board = {
  id: string;
  ko: string;
  group: "life" | "enjoy" | "talk";
  color: string;
  icon: IconName;
  desc: string;
  tags: Tag[];
  extra?: "market" | "event";
  titleHint: string;
  bodyHint: string;
};

const Q: Tag = { id: "question", ko: "질문", asks: true };
const INFO: Tag = { id: "info", ko: "정보" };
const REVIEW: Tag = { id: "review", ko: "후기" };

export const BOARDS: Board[] = [
  {
    id: "chat",
    ko: "노가리",
    group: "talk",
    color: "#E6186C",
    icon: "coffee",
    desc: "오늘 있었던 일, 한국 생활 소소한 수다. 아무 얘기나 편하게.",
    tags: [{ id: "chat", ko: "잡담" }, Q, { id: "worry", ko: "고민" }, { id: "funny", ko: "웃긴썰" }],
    titleHint: "오늘 한국에서 무슨 일이 있었나요?",
    bodyHint: "편하게 이야기해 주세요. 이웃들이 들어 줄게요.",
  },
  {
    id: "love",
    ko: "연애·관계",
    group: "talk",
    color: "#F0567A",
    icon: "heart",
    desc: "연애, 국제 커플, 친구와 가족 이야기. 혼자 고민하지 말아요.",
    tags: [{ id: "worry", ko: "고민", asks: true }, { id: "story", ko: "썰" }, { id: "advice", ko: "조언구함", asks: true }, { id: "couple", ko: "국제커플" }],
    titleHint: "어떤 고민이 있나요?",
    bodyHint: "상황을 적어 주면 이웃들이 경험을 나눠 줄 거예요. 상대를 알아볼 수 있는 정보는 빼 주세요.",
  },
  {
    id: "market",
    ko: "장터",
    group: "talk",
    color: "#CD7C2F",
    icon: "bag",
    desc: "이사 가며 정리하는 가구, 안 쓰는 전자제품, 무료 나눔까지.",
    tags: [{ id: "sell", ko: "팝니다" }, { id: "buy", ko: "삽니다" }, { id: "free", ko: "나눔" }],
    extra: "market",
    titleHint: "무엇을 거래하나요? (예: 전자레인지, 겨울 패딩)",
    bodyHint: "상태, 사용 기간, 거래 가능한 동네를 적어 주세요. 계좌번호나 연락처는 쓰지 말고 댓글로 대화해요.",
  },
  {
    id: "food",
    ko: "맛집·음식",
    group: "enjoy",
    color: "#EF7C1C",
    icon: "utensils",
    desc: "동네 맛집, 고향 음식 파는 곳, 편의점 꿀조합까지.",
    tags: [{ id: "recommend", ko: "추천" }, REVIEW, Q, { id: "home", ko: "고향음식" }],
    titleHint: "어떤 맛을 나누고 싶나요?",
    bodyHint: "가게 이름과 동네, 메뉴, 가격대를 적어 주면 좋아요.",
  },
  {
    id: "popup",
    ko: "팝업·이벤트",
    group: "enjoy",
    color: "#996CAC",
    icon: "ticket",
    desc: "성수동 팝업, 전시, 축제, 무료 공연. 놓치기 아까운 한국의 지금.",
    tags: [INFO, REVIEW, { id: "together", ko: "같이가요" }],
    extra: "event",
    titleHint: "어떤 팝업이나 행사인가요?",
    bodyHint: "기간, 장소, 예약 필요 여부, 외국어 안내가 있는지 적어 주세요.",
  },
  {
    id: "trip",
    ko: "여행·나들이",
    group: "enjoy",
    color: "#00A5DE",
    icon: "map",
    desc: "주말 당일치기, 계절 명소, 기차 여행 코스.",
    tags: [{ id: "recommend", ko: "추천" }, REVIEW, { id: "together", ko: "같이가요" }, Q],
    titleHint: "어디로 다녀왔거나 가고 싶나요?",
    bodyHint: "교통편, 비용, 소요 시간을 적어 주면 다음 사람에게 큰 도움이 돼요.",
  },
  {
    id: "korean",
    ko: "한국어",
    group: "enjoy",
    color: "#747F00",
    icon: "book",
    desc: "모르는 표현, 존댓말, 신조어. 같이 배우는 한국어.",
    tags: [Q, { id: "tip", ko: "꿀팁" }, { id: "study", ko: "스터디" }],
    titleHint: "어떤 표현이 궁금한가요?",
    bodyHint: "들은 상황과 문장을 그대로 적어 주면 더 정확히 알려 줄 수 있어요.",
  },
  {
    id: "transit",
    ko: "교통",
    group: "life",
    color: "#0052A4",
    icon: "bus",
    desc: "교통카드, 지하철·버스, 기차 예매, 운전면허.",
    tags: [Q, INFO, REVIEW],
    titleHint: "교통에서 무엇이 궁금한가요?",
    bodyHint: "어느 도시, 어떤 노선인지 적어 주세요.",
  },
  {
    id: "visa",
    ko: "비자·행정",
    group: "life",
    color: "#1B3A6B",
    icon: "idcard",
    desc: "체류 연장, 외국인등록증, 주민센터 서류, 세금.",
    tags: [Q, INFO, REVIEW],
    titleHint: "어떤 절차가 궁금한가요?",
    bodyHint: "비자 종류와 지역을 적어 주면 비슷한 경험을 가진 이웃이 답하기 쉬워요. 외국인등록번호는 쓰지 마세요.",
  },
  {
    id: "housing",
    ko: "집·주거",
    group: "life",
    color: "#00A84D",
    icon: "house",
    desc: "월세·전세, 계약, 분리수거, 이사, 룸메이트.",
    tags: [Q, INFO, REVIEW, { id: "roommate", ko: "룸메구함" }],
    titleHint: "집 문제로 무엇이 궁금한가요?",
    bodyHint: "동네(구 단위)와 계약 형태를 적어 주세요. 상세 주소는 쓰지 마세요.",
  },
  {
    id: "health",
    ko: "병원·건강",
    group: "life",
    color: "#D43F3A",
    icon: "medical",
    desc: "병원 찾기, 건강보험, 약국, 영어 되는 병원.",
    tags: [Q, INFO, REVIEW],
    titleHint: "어떤 도움이 필요한가요?",
    bodyHint: "증상이 급하면 119에 먼저 연락하세요. 여기서는 경험을 나눠요.",
  },
  {
    id: "work",
    ko: "일자리·알바",
    group: "life",
    color: "#3E5A99",
    icon: "briefcase",
    desc: "알바, 취업, 근로계약, 임금 문제.",
    tags: [Q, { id: "hiring", ko: "구인" }, { id: "seeking", ko: "구직" }, REVIEW],
    titleHint: "일 관련해서 무엇을 나누고 싶나요?",
    bodyHint: "체류 자격에 따라 할 수 있는 일이 달라요. 임금 체불은 1350(고용노동부)에서 상담할 수 있어요.",
  },
];

/** Each country's lounge: only members of that nationality can read and post. */
export const LOUNGE: Board = {
  id: "lounge",
  ko: "라운지",
  group: "talk",
  color: "#1B3A6B",
  icon: "users",
  desc: "같은 나라 이웃끼리, 우리말로 편하게.",
  tags: [{ id: "chat", ko: "잡담" }, Q, INFO, { id: "meetup", ko: "모임" }],
  titleHint: "고향 이웃들과 나누고 싶은 이야기",
  bodyHint: "우리말로 편하게 써도 돼요. 이 라운지는 같은 국적 이웃만 볼 수 있어요.",
};

export const GROUPS = [
  { id: "life", ko: "생활 정보" },
  { id: "enjoy", ko: "한국 즐기기" },
  { id: "talk", ko: "이야기" },
] as const;

const BY_ID = new Map([...BOARDS, LOUNGE].map((b) => [b.id, b]));
export const boardOf = (id: string) => BY_ID.get(id) ?? BOARDS[0];
export const isBoard = (id: string) => BOARDS.some((b) => b.id === id);
export const tagOf = (board: string, tag: string) => boardOf(board).tags.find((t) => t.id === tag) ?? { id: tag, ko: tag };
/** Tag ids that count as a question waiting for answers, across all boards. */
export const ASKING_TAGS = [...new Set([...BOARDS, LOUNGE].flatMap((b) => b.tags.filter((t) => t.asks).map((t) => t.id)))];

export const DEALS = [
  { id: "open", ko: "판매중" },
  { id: "reserved", ko: "예약중" },
  { id: "done", ko: "거래완료" },
] as const;

// Levels by points (posts + 2 x answers + 3 x helpful votes received).
export const LEVELS = [
  { min: 0, ko: "새싹 이웃", color: "#7CB342" },
  { min: 10, ko: "반가운 이웃", color: "#00A5DE" },
  { min: 30, ko: "든든한 이웃", color: "#0052A4" },
  { min: 80, ko: "동네 반장", color: "#996CAC" },
  { min: 200, ko: "명예 주민", color: "#EF7C1C" },
] as const;
export function levelOf(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++;
  return { ...LEVELS[i], index: i, next: LEVELS[i + 1] ?? null };
}

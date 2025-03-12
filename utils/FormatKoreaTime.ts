import { Timestamp } from "firebase/firestore";

// firebase timestamp 변환
export const formatCreatedAt = (utcTimestamp: string | Timestamp | null) => {
  if (!utcTimestamp) return "날짜 없음";

  let date;

  // Firestore Timestamp 객체인지 확인 후 변환
  if (utcTimestamp instanceof Timestamp) {
    date = utcTimestamp.toDate(); // Firestore Timestamp를 Date로 변환
  } else {
    date = new Date(utcTimestamp); // 일반 문자열 타임스탬프 처리
  }

  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // 12시간제 (오전/오후)
  });
};
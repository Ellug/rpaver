"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/libs/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { formatCreatedAt } from "@/utils/FormatKoreaTime"; // Timestamp 변환 함수
import LoadingModal from "@/components/LoadingModal";

export default function HistoryResults({ queryText }: { queryText: string }) {
  const [results, setResults] = useState<HistoryDocType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleSelect = (id: number, date: string) => {
    const selectedData = { id, date };
    sessionStorage.setItem("selectedHistory", JSON.stringify(selectedData)); // ✅ 객체 통째로 저장
    router.push("/board/history"); // ✅ URL은 깔끔하게 유지
  };  

  useEffect(() => {
    if (!queryText.trim()) return;

    const fetchSearchResults = async () => {
      setLoading(true);

      try {
        const historySnapshot = await getDocs(collection(db, "history"));

        // 🔍 history의 title 필드에서 검색
        const historyResults = await Promise.all(
          historySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            const title = data.title?.toLowerCase() || "";

            if (title.includes(queryText.toLowerCase())) {
              // 🔥 해당 title이 검색어를 포함하면 content도 조회
              const contentDocRef = doc(db, "history_content", `content_${docSnapshot.id}`);
              const contentDocSnap = await getDoc(contentDocRef);
              const content = contentDocSnap.exists() ? contentDocSnap.data().content : "";

              return {
                id: Number(docSnapshot.id),
                title: data.title,
                date: data.date || "날짜 없음", // 날짜 추가
                content,
                updatedAt: formatCreatedAt(data.updatedAt || ""), // updatedAt 변환
                createdAt: formatCreatedAt(data.createdAt || ""), // createdAt 변환
              };
            }
            return null;
          })
        );

        // 🔥 필터링하여 유효한 값만 저장
        setResults(historyResults.filter((item) => item !== null));
      } catch (error) {
        console.error("검색 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [queryText]);

  // 🔥 검색어 하이라이트 (title, content)
  const highlightText = (text: string | undefined): string => {
    if (!text) return "";
    const regex = new RegExp(`(${queryText})`, "gi");
    return text.replace(regex, `<span class="text-yellow-400 font-bold">$1</span>`);
  };

  // 🔥 검색어 주변 텍스트 추출 (본문)
  const extractContext = (text: string | undefined): string => {
    if (!text) return "";

    const lowerText = text.toLowerCase();
    const lowerKeyword = queryText.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerKeyword);

    if (matchIndex === -1) {
      return highlightText(text.substring(0, 200) + (text.length > 200 ? "..." : ""));
    }

    const start = Math.max(0, matchIndex - 10);
    const end = Math.min(text.length, matchIndex + lowerKeyword.length + 120);

    return highlightText((start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : ""));
  };

  return (
    <div className="text-white">
      {loading ? (
        <LoadingModal />
      ) : results.length === 0 ? (
        <p>검색 결과가 없습니다.</p>
      ) : (
        <ul>
          {results.map((item, index) => (
            <li
              key={item.id || index}
              className="p-6 border-t border-gray-500 border-opacity-80 shadow-md 
                         hover:bg-gray-900 hover:bg-opacity-70 transition cursor-pointer"
                         onClick={() => handleSelect(item.id, item.date)}
            >
              {/* 🔥 히스토리 제목 + 날짜 */} 
              <h3 className="text-2xl font-bold mb-2 flex justify-start gap-8 items-center">
                <span dangerouslySetInnerHTML={{ __html: highlightText(item.title) }} />
                <span className="text-gray-300 text-sm">{item.date}</span>
              </h3>

              {/* 🔥 본문 미리보기 */}
              <p
                className="mt-4 text-md leading-relaxed"
                dangerouslySetInnerHTML={{ __html: extractContext(item.content) }}
              />
              <p className="text-xs text-gray-500">마지막 수정 날짜: {item.updatedAt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
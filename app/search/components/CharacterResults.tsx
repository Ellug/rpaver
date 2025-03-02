"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/libs/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function CharacterResults({ queryText }: { queryText: string }) {
  const [results, setResults] = useState<CharacterDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!queryText.trim()) return;

    const fetchSearchResults = async () => {
      setLoading(true);

      try {
        const snapshot = await getDocs(collection(db, "character_detail"));
        const searchResults: CharacterDetail[] = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((data) =>
            Object.values(data).some(
              (value) =>
                typeof value === "string" &&
                value.toLowerCase().includes(queryText.toLowerCase())
            )
          );

        setResults(searchResults);
      } catch (error) {
        console.error("검색 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [queryText]);

  // 🔥 검색어 하이라이트 함수 (undefined 방지)
  const highlightText = (text: string | undefined): string => {
    if (!text) return ""; // ✅ undefined 방지
    const regex = new RegExp(`(${queryText})`, "gi");
    return text.replace(
      regex,
      `<span class="text-yellow-400 font-bold">$1</span>`
    );
  };

  // 🔹 검색어 주변 텍스트 추출 함수 (undefined 방지)
  const extractContext = (text: string | undefined, keyword: string): string => {
    if (!text) return "";
  
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerKeyword);
  
    if (matchIndex === -1) {
      // 검색어가 없을 경우 앞에서 200글자만 출력
      const snippet = text.substring(0, 200) + (text.length > 200 ? "..." : "");
      return highlightText(snippet);
    }
  
    const start = Math.max(0, matchIndex - 10);
    const end = Math.min(text.length, matchIndex + lowerKeyword.length + 120);
    
    const snippet = (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");
    
    return highlightText(snippet);
  };
  

  // 🔹 렌더링할 필드 배열 (기본 정보)
  const infoFields = [
    { label: "칭호", key: "title" },
    { label: "국적", key: "country" },
    { label: "소속", key: "party" },
    { label: "취미", key: "hobby" },
    { label: "무기", key: "weapon" },
    { label: "특기", key: "talent" },
    { label: "능력", key: "skill" },
  ];

  return (
    <div className="text-white">
      {loading ? (
        <p>검색 중...</p>
      ) : results.length === 0 ? (
        <p>검색 결과가 없습니다.</p>
      ) : (
        <ul>
          {results.map((item, index) => (
            <li
              key={item.id || index}
              className="p-6 border-t border-gray-500 border-opacity-80 shadow-md 
                         hover:bg-gray-900 hover:bg-opacity-70 transition cursor-pointer"
              onClick={() => router.push(`/board/character/detail/${item.id}`)} // ✅ 클릭 시 라우팅
            >
              {/* 캐릭터 정보 */}
              <h3
                className="text-2xl font-bold mb-4"
                dangerouslySetInnerHTML={{
                  __html: highlightText(`${item.name || ""} ${item.family || ""}`),
                }}
              />

              {/* 기본 정보 (배열을 사용한 동적 렌더링) */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {infoFields.map(({ label, key }, fieldIndex) => {
                  const value = item[key as keyof CharacterDetail] as string | undefined;
                  if (!value) return null; // ✅ 값이 없는 필드는 렌더링하지 않음
                  return (
                    <p
                      key={`${key}-${fieldIndex}`}
                      dangerouslySetInnerHTML={{
                        __html: `<strong>${label}:</strong> ${highlightText(value)}`,
                      }}
                    />
                  );
                })}
              </div>

              <p
                className="mt-4 text-md leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: extractContext(item.detail, queryText),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
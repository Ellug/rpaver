"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/libs/firebaseConfig";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import LoadingModal from "@/components/LoadingModal";

interface PageData {
  imageUrl: string;
  detail: string;
}

interface Item {
  id: string;
  category: string;
  name: string;
  pages: PageData[];
  created: number;
  author: string;
}

export default function ItemResults({ queryText }: { queryText: string }) {
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!queryText.trim()) return;

    const fetchSearchResults = async () => {
      setLoading(true);

      try {
        const snapshot = await getDocs(collection(db, "items"));
        const searchTerms = queryText.trim().toLowerCase().split(/\s+/);

        const searchResults: Item[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              category: data.category || "",
              name: data.name || "",
              pages: data.pages || [],
              created: data.created instanceof Timestamp ? data.created.toMillis() : 0,
              author: data.author || "unknown",
            };
          })
          .filter((item) => {
            const pageDetails = item.pages.map((page: { detail: string; }) => page.detail.toLowerCase()).join(" ");
            const combinedFields = `${item.name.toLowerCase()} ${item.category.toLowerCase()} ${pageDetails}`;
            return searchTerms.every((term) => combinedFields.includes(term));
          });

        setResults(searchResults);
      } catch (error) {
        console.error("🔥 아이템 검색 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [queryText]);

  // 검색어 하이라이트 함수
  const highlightText = (text: string | undefined): string => {
    if (!text) return "";
    const regex = new RegExp(`(${queryText})`, "gi");
    return text.replace(regex, `<span class="text-yellow-400 font-bold">$1</span>`);
  };

  // 검색어 주변 detail 발췌 함수
  const extractPageContext = (pages: PageData[], keyword: string): string => {
    for (const page of pages) {
      if (page.detail.toLowerCase().includes(keyword.toLowerCase())) {
        const lowerText = page.detail.toLowerCase();
        const matchIndex = lowerText.indexOf(keyword.toLowerCase());
        const start = Math.max(0, matchIndex - 10);
        const end = Math.min(page.detail.length, matchIndex + keyword.length + 120);
        const snippet = (start > 0 ? "..." : "") + page.detail.substring(start, end) + (end < page.detail.length ? "..." : "");
        return highlightText(snippet);
      }
    }
    return "";
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
              className="p-6 border-t border-gray-500 border-opacity-80 shadow-md hover:bg-gray-900 hover:bg-opacity-70 transition cursor-pointer"
              onClick={() => router.push(`/board/item/detail/${item.id}`)}
            >
              <h3
                className="text-2xl font-bold mb-4"
                dangerouslySetInnerHTML={{
                  __html: highlightText(item.name),
                }}
              />

              <div className="grid grid-cols-2 gap-2 text-sm">
                <p dangerouslySetInnerHTML={{ __html: `<strong>카테고리:</strong> ${highlightText(item.category)}` }} />
                <p dangerouslySetInnerHTML={{ __html: `<strong>등록일:</strong> ${new Date(item.created).toLocaleDateString("ko-KR")}` }} />
              </div>

              {/* 페이지 내용 중 검색어 포함된 부분 보여주기 */}
              <p
                className="mt-4 text-md leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: extractPageContext(item.pages, queryText),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { Search as SearchIcon, ChevronDown } from "lucide-react";

const categories = ["전체", "자유", "캐릭터", "아이템", "히스토리", "설정", "갤러리"];
// const collectionList = ["character_detail", "freeboard", "items"]

export default function Search({ setHoveredCategory }: { setHoveredCategory: (category: string | null) => void }) {
  const [category, setCategory] = useState(categories[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 검색 실행 함수
  const handleSearch = async () => {
    if (!searchTerm.trim()) return; // 검색어가 비어 있으면 실행 안 함

    console.log(`🔍 [${category} 검색] "${searchTerm}" 실행 중...`);

    let collection = "";
    switch (category) {
      case "캐릭터":
        collection = "character";
        break;
      case "히스토리":
        collection = "history";
        break;
      case "설정":
        collection = "worldset";
        break;
      case "갤러리":
        collection = "gallery";
        break;
      default:
        collection = "all"; // 전체 검색 (여러 컬렉션에서 실행)
        break;
    }

    try {
      // TODO: Firebase Firestore에서 검색 쿼리 실행할 로직 추가
      console.log(`📂 Firestore 컬렉션: ${collection}, 검색어: "${searchTerm}"`);
      // 예시) Firestore 검색 쿼리
      /*
      const q = query(collection(db, collection), where("title", ">=", searchTerm));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        console.log("검색 결과:", doc.data());
      });
      */
    } catch (error) {
      console.error("검색 오류:", error);
    }
  };

  return (
    <div
      className="relative flex items-center border border-gray-300 bg-white rounded-full shadow-md px-4 py-2 text-black z-50"
      onMouseEnter={() => setHoveredCategory("검색")}
      onMouseLeave={() => setHoveredCategory(null)}
    >
      {/* 드롭다운 메뉴 */}
      <div className="relative">
        <button
          className="flex w-24 items-center gap-2 px-3 py-1 text-gray-700 bg-white rounded-l-full hover:bg-gray-100 focus:outline-none"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {category}
          <ChevronDown className="w-4 h-4" />
        </button>

        {isDropdownOpen && (
          <ul className="absolute left-0 mt-2 w-24 bg-white border border-gray-200 shadow-lg rounded-lg text-sm z-[100]">
            {categories.map((cat) => (
              <li
                key={cat}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setCategory(cat);
                  setIsDropdownOpen(false);
                }}
              >
                {cat}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 검색 입력창 */}
      <input
        type="text"
        className="flex-grow px-3 py-1 focus:outline-none"
        placeholder="검색어를 입력하세요..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()} // 엔터 키 검색 실행
      />

      {/* 검색 버튼 */}
      <button className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none" onClick={handleSearch}>
        <SearchIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

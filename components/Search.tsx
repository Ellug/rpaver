"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, ChevronDown } from "lucide-react";

// 카테고리 리스트
const categories = [
  // { name: "전체", value: "all" },
  // { name: "자유", value: "free" },
  { name: "캐릭터", value: "character" },
  { name: "히스토리", value: "history" },
  { name: "아이템", value: "items" },
  { name: "갤러리", value: "gallery" },
];

// ✅ `setHoveredCategory`를 `props`로 추가!
export default function Search({ setHoveredCategory }: { setHoveredCategory?: (category: string | null) => void }) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    router.push(`/search/${encodeURIComponent(searchTerm)}?category=${encodeURIComponent(selectedCategory.value)}`);
  };

  return (
    <div
      className="relative flex items-center border border-gray-300 bg-white rounded-full shadow-md px-4 py-2 text-black w-full md:w-[600px]"
      onMouseEnter={() => setHoveredCategory?.("검색")}
      onMouseLeave={() => setHoveredCategory?.(null)}
    >
      {/* 카테고리 선택 드롭다운 */}
      <div className="relative">
        <button
          className="flex w-28 items-center gap-2 px-3 py-1 text-gray-700 bg-white rounded-l-full hover:bg-gray-100 focus:outline-none"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {selectedCategory.name} <ChevronDown className="w-4 h-4" />
        </button>
        {isDropdownOpen && (
          <ul className="absolute left-0 mt-2 w-24 bg-white border border-gray-200 shadow-lg rounded-lg text-sm">
            {categories.map((cat) => (
              <li
                key={cat.value}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsDropdownOpen(false);
                }}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        type="text"
        className="flex-grow px-3 py-1 focus:outline-none"
        placeholder="검색어를 입력하세요..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />

      <button className="p-2 text-gray-500 hover:text-gray-700" onClick={handleSearch}>
        <SearchIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
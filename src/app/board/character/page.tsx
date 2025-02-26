"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/libs/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import LoadingModal from "@/components/LoadingModal"; // 로딩 모달 추가

type Character = {
  id: string; // Firestore 문서 ID 추가
  birth: string;
  name: string;
  family: string;
  title: string;
  gender: string;
  unit: string;
  party: string;
  skill: string;
  body: string;
};

// 테이블 컬럼 타입 정의
type Column =
  | { key: keyof Character; label: string; mobile?: boolean }
  | { key: "age"; label: string; value: (char: Character, currentYear: number) => string | number; mobile?: boolean };

// 테이블 컬럼 정의
const columns: Column[] = [
  { key: "birth", label: "출생", mobile: true },
  { key: "name", label: "이름", mobile: true },
  { key: "family", label: "성(가문)", mobile: true },
  { key: "title", label: "칭호" },
  {
    key: "age",
    label: "나이",
    value: (char: Character, currentYear: number) =>
      currentYear ? (char.birth ? currentYear - parseInt(char.birth, 10) : "-") : "-",
  },
  { key: "gender", label: "성별" },
  { key: "unit", label: "유닛" },
  { key: "party", label: "소속" },
  { key: "skill", label: "스킬" },
  { key: "body", label: "신체" },
];

export default function CharacterPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sortedCharacters, setSortedCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentYear, setCurrentYear] = useState<string>("52");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    // Firestore 실시간 데이터 감지
    const unsubscribe = onSnapshot(collection(db, "characters"), (snapshot) => {
      const updatedCharacters: Character[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Character;
        return {
          ...data,
          id: data.id || doc.id,
        };
      });      

      setCharacters(updatedCharacters);
      sortCharacters(updatedCharacters, sortOrder);
      setLoading(false);
    });

    return () => unsubscribe(); // Firestore 리스너 정리
  }, []);

  // 정렬 함수 (Firestore 호출 없이 로컬에서 정렬)
  const sortCharacters = (data: Character[], order: "asc" | "desc") => {
    const sortedData = [...data].sort((a, b) =>
      order === "desc"
        ? parseInt(b.birth, 10) - parseInt(a.birth, 10)
        : parseInt(a.birth, 10) - parseInt(b.birth, 10)
    );
    setSortedCharacters(sortedData);
  };

  // 정렬 토글
  const toggleSortOrder = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newOrder);
    sortCharacters(characters, newOrder);
  };

  // 현재 연도 변경 핸들러
  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (/^\d*$/.test(inputValue)) {
      setCurrentYear(inputValue);
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  // 캐릭터 클릭 시 상세 페이지 이동
  const handleCharacterClick = (id: string) => {
    router.push(`/board/character/detail/${encodeURIComponent(id)}`);
  };

  // 등록 버튼 클릭 시 등록 페이지 이동
  const handleRegisterClick = () => {
    router.push("/board/character/add");
  };

  // 하이라이트 적용 함수
  const highlightText = (text: string, query: string) => {
    if (!query || !text.toLowerCase().includes(query)) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query ? <span key={index} className="text-gold font-bold">{part}</span> : part
    );
  };

  // 검색 필터링
  const filteredCharacters = sortedCharacters.filter((char) =>
    Object.values(char).some((value) =>
      typeof value === "string" && value.toLowerCase().includes(searchTerm)
    )
  );

  return (
    <div className="my-10 md:my-12 p-6">
      {loading && <LoadingModal />} {/* 로딩 모달 추가 */}

      {/* 정렬 & 연도 & 검색 UI */}
      <div className="flex flex-col md:flex-row md:w-[90%] max-w-[1920px] mx-auto justify-between items-center gap-4 mb-4 text-sm">
        <div className="flex flex-row gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="yearInput" className="text-gray-200 font-medium">연도:</label>
            <input
              id="yearInput"
              type="text"
              value={currentYear}
              onChange={handleYearChange}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-black text-center focus:ring focus:ring-blue-200"
              placeholder="연도 입력"
            />
          </div>

          <button
            onClick={toggleSortOrder}
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 transition"
          >
            {sortOrder === "desc" ? "내림차순 ↓" : "오름차순 ↑"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="searchInput" className="text-gray-200 font-medium">검색:</label>
          <input
            id="searchInput"
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-60 px-4 py-1 border border-gray-300 rounded-md text-black focus:ring focus:ring-blue-200"
            placeholder="이름, 유닛, 소속 등 검색"
            autoComplete="false"
          />
        </div>

        {/* 등록 버튼 (테이블 우측 상단) */}
        <button
          onClick={handleRegisterClick}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition"
        >
          등록
        </button>
      </div>

      <div className="overflow-x-auto text-sm">
        <table className="mx-auto w-[90%] max-w-[1920px] border border-gray-300">
          <thead>
            <tr className="bg-gray-700 text-left">
              {columns.map((col) => (
                <th key={col.key} className={`border px-4 py-3 ${col.mobile ? "" : "hidden md:table-cell"}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCharacters.map((char) => (
              <tr
                key={char.id}
                className="hover:bg-gray-800 hover:text-gold cursor-pointer"
                onClick={() => handleCharacterClick(char.id)} // 클릭 시 상세 페이지 이동
              >
                {columns.map((col) => (
                  <td key={col.key} className={`border px-4 py-3 ${col.mobile ? "" : "hidden md:table-cell"}`}>
                    {"value" in col
                      ? col.value(char, currentYear ? parseInt(currentYear, 10) : NaN)
                      : highlightText(char[col.key as keyof Character] || "-", searchTerm)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
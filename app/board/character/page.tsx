"use client";

import React, { useState, useEffect } from "react";
import { useCharacterContext } from "@/contexts/CharacterContext";
import { useRouter } from "next/navigation";
import LoadingModal from "@/components/LoadingModal";

type SortKey = "birth" | "height" | "weight" | "chest";

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
  const { characters } = useCharacterContext();
  const [sortedCharacters, setSortedCharacters] = useState<Character[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentYear, setCurrentYear] = useState<string>("552");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey | "birth">("birth");
  const [selectedSeries, setSelectedSeries] = useState<string>("전체");

  // 시리즈 목록 생성
  const seriesList = React.useMemo(() => {
    const seriesSet = new Set<string>();
  
    characters.forEach((char) => {
      if (char.series) {
        char.series.split(",").map((s) => seriesSet.add(s.trim()));
      } else {
        seriesSet.add("없음");
      }
    });
  
    // "전체"와 "없음"을 맨 위로, 나머지는 ㄱㄴㄷ 순으로 정렬
    const sortedSeries = Array.from(seriesSet).filter(s => s !== "전체" && s !== "없음").sort((a, b) => a.localeCompare(b, "ko-KR"));
    
    return ["전체", "없음", ...sortedSeries];
  }, [characters]);
    

  useEffect(() => {
    sortCharacters(characters, sortKey, sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, sortKey, sortOrder]);

  const extractBodyValues = (body: string) => {
    if (!body) return { height: 0, weight: 0, chest: null }; // 기본값을 null로 설정
  
    const heightMatch = body.match(/(\d+)\s?cm/);
    const weightMatch = body.match(/(\d+)\s?kg/);
    const chestMatch = body.match(/\b([A-Z])\b/); // 대문자 한 글자 추출
  
    return {
      height: heightMatch ? parseInt(heightMatch[1], 10) : 0,
      weight: weightMatch ? parseInt(weightMatch[1], 10) : 0,
      chest: chestMatch ? chestMatch[1] : null, // 가슴 값이 없으면 null 반환
    };
  };
  
  const sortCharacters = (data: Character[], key: SortKey, order: "asc" | "desc") => {
    const sortedData = [...data].sort((a, b) => {
      const aValues = extractBodyValues(a.body);
      const bValues = extractBodyValues(b.body);
  
      const aValue: number | string | null = key === "birth" ? parseInt(a.birth || "", 10) : aValues[key];
      const bValue: number | string | null = key === "birth" ? parseInt(b.birth || "", 10) : bValues[key];
  
      // 🔹 가슴 크기 정렬 (빈 값은 맨 뒤로)
      if (key === "chest") {
        const aStr = aValue ? String(aValue) : ""; 
        const bStr = bValue ? String(bValue) : "";
  
        if (!aStr) return 1; // a가 빈 값이면 b보다 뒤로 이동
        if (!bStr) return -1; // b가 빈 값이면 a보다 앞으로 이동
  
        return order === "desc" ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
      }
  
      // 🔹 출생 연도 정렬 (숫자가 아닌 값은 항상 최하단으로)
      if (key === "birth") {
        const aIsInvalid = isNaN(aValue as number) || a.birth === "";
        const bIsInvalid = isNaN(bValue as number) || b.birth === "";
  
        if (aIsInvalid && !bIsInvalid) return 1; // a가 빈 값이면 b보다 뒤로 이동
        if (!aIsInvalid && bIsInvalid) return -1; // b가 빈 값이면 a보다 앞으로 이동
        if (aIsInvalid && bIsInvalid) return 0; // 둘 다 빈 값이면 순서 유지
      }
  
      return order === "desc"
        ? (bValue as number) - (aValue as number)
        : (aValue as number) - (bValue as number);
    });
  
    setSortedCharacters(sortedData);
  };
  
  const toggleSortOrder = (key: SortKey) => {
    const newOrder = sortKey === key && sortOrder === "desc" ? "asc" : "desc";
    setSortKey(key);
    setSortOrder(newOrder);
    sortCharacters(characters, key, newOrder);
  };
  

  // 현재 연도 변경 핸들러
  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (/^\d*$/.test(inputValue)) {
      setCurrentYear(inputValue);
    }
  };

  // 시리즈 변경 핸들러
  const handleSeriesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSeries(event.target.value);
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

  // 검색 & 시리즈 필터링
  const filteredCharacters = sortedCharacters.filter((char) => {
    const matchesSearch = Object.values(char).some((value) =>
      typeof value === "string" && value.toLowerCase().includes(searchTerm)
    );

    const matchesSeries =
      selectedSeries === "전체"
        ? true
        : selectedSeries === "없음"
        ? !char.series || char.series.trim() === ""
        : char.series?.split(",").map((s) => s.trim()).includes(selectedSeries);

    return matchesSearch && matchesSeries;
  });

  return (
    <div className="my-10 md:my-12 p-6">
      {!characters.length && <LoadingModal />}

      {/* 정렬 & 연도 & 검색 UI */}
      <div className="flex flex-col md:flex-row md:w-[90%] max-w-[1920px] mx-auto justify-between items-center gap-4 mb-4 text-sm">
        <div className="flex flex-row gap-4">
          <div className="flex items-center">
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
        </div>

        {/* 시리즈 메뉴 */}
        <div className="flex items-center">
          <label htmlFor="seriesSelect" className="text-gray-200 font-medium ml-4">시리즈:</label>
          <select
            id="seriesSelect"
            value={selectedSeries}
            onChange={handleSeriesChange}
            className="px-2 py-1 border border-gray-300 rounded-md text-black focus:ring focus:ring-blue-200"
          >
            {seriesList.map((series) => (
              <option key={series} value={series}>{series}</option>
            ))}
          </select>
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
            autoComplete="off"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={() => toggleSortOrder("height")} className="px-4 py-2 bg-purple-900 text-white rounded-md hover:bg-purple-700 transition">
            키 {sortKey === "height" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button onClick={() => toggleSortOrder("weight")} className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-700 transition">
            체중 {sortKey === "weight" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button onClick={() => toggleSortOrder("chest")} className="px-4 py-2 bg-yellow-900 text-white rounded-md hover:bg-yellow-700 transition">
            가슴 {sortKey === "chest" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
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
                <th
                  key={col.key}
                  className={`border px-4 py-3 ${col.mobile ? "" : "hidden md:table-cell"} ${
                    col.key === "birth" ? "cursor-pointer hover:bg-gray-600" : ""
                  }`}
                  onClick={col.key === "birth" ? () => toggleSortOrder("birth") : undefined}
                >
                  {col.label}
                  {col.key === "birth" && (
                    <span className="ml-1">{sortKey === "birth" ? (sortOrder === "desc" ? "↓" : "↑") : ""}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredCharacters.map((char) => (
              <tr
                key={char.id}
                className="hover:bg-gray-800 hover:text-gold cursor-pointer"
                onClick={() => handleCharacterClick(char.id)}
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
"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";
import { useRouter } from "next/navigation";

// 아이템 타입 정의
type Item = {
  id: string;
  category: string;
  name: string;
  detail: string;
  created: number; // Firebase Timestamp (밀리초 변환)
};

export default function ItemBoard() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>(""); // 🔹 검색어 상태 추가
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "items"));

      const fetchedItems: Item[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          category: data.category || "", // 기본값 추가
          name: data.name || "",
          detail: data.detail || "",
          created: data.created instanceof Timestamp ? data.created.toMillis() : 0, // 🔥 Timestamp 변환
        };
      });

      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
    };

    fetchItems();
  }, []);

  // 🔹 필터 적용 (카테고리 & 검색어)
  useEffect(() => {
    let updatedItems = [...items];

    if (filterCategory) {
      updatedItems = updatedItems.filter((item) => item.category === filterCategory);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      updatedItems = updatedItems.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          item.detail.toLowerCase().includes(lowerSearch)
      );
    }

    updatedItems.sort((a, b) =>
      sortOrder === "desc" ? b.created - a.created : a.created - b.created
    );

    setFilteredItems(updatedItems);
  }, [filterCategory, searchTerm, sortOrder, items]);

  // 🔹 정렬 토글 (등록일 기준)
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  // 🔹 등록 버튼 클릭 시 이동
  const handleRegisterClick = () => {
    router.push("/board/item/add");
  };

  // 🔹 상세 페이지 이동
  const handleRowClick = (id: string) => {
    router.push(`/board/item/detail/${id}`);
  };

  // 🔹 설명 필드 내용 자르기
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">아이템 게시판</h1>

      {/* 필터 & 검색 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
        {/* 🔹 카테고리 필터 */}
        <div className="flex items-center gap-2">
          <label className="font-medium">카테고리:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border text-black px-3 py-1 rounded-md"
          >
            <option value="">전체</option>
            {[...new Set(items.map((item) => item.category))].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 🔹 검색 인풋 (이름 & 설명 검색) */}
        <div className="flex items-center gap-2">
          <label className="font-medium">검색:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border text-black px-3 py-1 rounded-md"
            placeholder="이름 또는 설명 검색"
          />
        </div>

        {/* 🔹 등록 버튼 */}
        <button
          onClick={handleRegisterClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
        >
          등록
        </button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto text-sm">
        <table className="w-full border border-gray-800">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="border px-4 py-2">카테고리</th>
              <th className="border px-4 py-2">이름</th>
              <th className="border px-4 py-2">설명</th>
              <th
                className="border px-4 py-2 cursor-pointer hover:text-gold"
                onClick={toggleSortOrder}
              >
                등록일 {sortOrder === "desc" ? "↓" : "↑"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} onClick={() => handleRowClick(item.id)} className="hover:bg-gray-800 cursor-pointer">
                <td className="border px-4 py-2">{item.category}</td>
                <td className="border px-4 py-2">{item.name}</td>
                <td className="border px-4 py-2">{truncateText(item.detail, 30)}</td>
                <td className="border px-4 py-2">
                  {new Date(item.created).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
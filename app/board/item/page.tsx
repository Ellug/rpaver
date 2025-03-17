"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";

// 아이템 타입 정의
type PageData = {
  imageUrl: string;
  detail: string;
};

type Item = {
  id: string;
  category: string;
  name: string;
  pages: PageData[];
  created: number;
  updatedAt: number;
  author: string;
};

export default function ItemBoard() {
  const router = useRouter();
  const { users } = useUserContext();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<keyof Item>("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "items"));

      const fetchedItems: Item[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          category: data.category || "",
          name: data.name || "",
          pages: data.pages || [],
          created: data.created instanceof Timestamp ? data.created.toMillis() : 0,
          updatedAt: data.created instanceof Timestamp ? data.updatedAt.toMillis() : 0,
          author: data.author || "unknown",
        };
      });

      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
    };

    fetchItems();
  }, []);

  // 필터 & 정렬 적용
  useEffect(() => {
    let updatedItems = [...items];
  
    // 🔹 카테고리 필터
    if (filterCategory) {
      updatedItems = updatedItems.filter((item) => item.category === filterCategory);
    }
  
    // 🔹 검색 필터
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      updatedItems = updatedItems.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(lowerSearch);
  
        // 작성자 이름 (users context)
        const authorName = users[item.author]?.name?.toLowerCase() || "";
        const authorMatch = authorName.includes(lowerSearch);
  
        // pages 내부 detail 전체 문자열로 합치기
        const detailsText = item.pages.map((page) => page.detail).join(" ").toLowerCase();
        const detailMatch = detailsText.includes(lowerSearch);
  
        return nameMatch || authorMatch || detailMatch;
      });
    }
  
    // 🔹 정렬
    updatedItems.sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
  
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "desc"
          ? valueB.localeCompare(valueA)
          : valueA.localeCompare(valueB);
      } else {
        return sortOrder === "desc"
          ? (valueB as number) - (valueA as number)
          : (valueA as number) - (valueB as number);
      }
    });
  
    setFilteredItems(updatedItems);
  }, [filterCategory, searchTerm, sortOrder, sortColumn, items, users]);
  

  // 🔹 정렬 토글
  const toggleSort = (column: keyof Item) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortColumn(column);
      setSortOrder("desc");
    }
  };

  // 🔹 등록 버튼 클릭 시 이동
  const handleRegisterClick = () => {
    router.push("/board/item/add");
  };

  // 🔹 상세 페이지 이동
  const handleRowClick = (id: string) => {
    router.push(`/board/item/detail/${id}`);
  };

  // 🔹 테이블 컬럼 정의
  const columns = [
    { label: "카테고리", field: "category", noMobile: undefined },
    { label: "이름", field: "name", noMobile: undefined },
    { label: "작성자", field: "author", noMobile: true },
    { label: "등록일", field: "created", noMobile: true },
    { label: "수정일", field: "updatedAt", noMobile: true },
  ] as const;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">사전 게시판</h1>

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

        {/* 검색 인풋 */}
        <div className="flex items-center gap-2">
          <label className="font-medium">검색:</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // form submit 방지
                setSearchTerm(searchInput);
              }
            }}
            className="border text-black px-3 py-1 rounded-md"
            placeholder="이름, 설명, 작성자 검색"
          />
          <button
            onClick={() => setSearchTerm(searchInput)}
            className="px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
          >
            검색
          </button>
        </div>

        {/* 등록 버튼 */}
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
              {columns.map((col) => (
                <th
                  key={col.field}
                  className={`border px-4 py-2 cursor-pointer hover:text-gold ${col.noMobile ? "max-md:hidden" : ""}`}
                  onClick={() => toggleSort(col.field)}
                >
                  {col.label} {sortColumn === col.field ? (sortOrder === "desc" ? "↓" : "↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const user = users[item.author]; // 작성자 정보
              return (
                <tr key={item.id} onClick={() => handleRowClick(item.id)} className="hover:bg-gray-800 cursor-pointer">
                  <td className="border px-4 py-2 text-center">{item.category}</td>
                  <td className="border px-4 py-2">{item.name}</td>
                  <td className="border px-4 py-2 flex items-center gap-2 max-md:hidden">
                    {user ? (
                      <>
                        <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
                        <span>{user.name}</span>
                      </>
                    ) : (
                      <p>알 수 없는 사용자</p>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-right max-md:hidden">
                    {new Date(item.created).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="border px-4 py-2 text-right max-md:hidden">
                    {new Date(item.updatedAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

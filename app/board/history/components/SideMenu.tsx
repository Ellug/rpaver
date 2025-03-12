"use client";

import React, { useState } from "react";
import { collection, query, orderBy, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";

interface SideMenuProps {
  documents: HistoryDocType[];
  onSelect: (id: number) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}


const SideMenu: React.FC<SideMenuProps> = ({ documents, onSelect, selectedCategory, setSelectedCategory }) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"date" | "title">("date"); // 🔄 날짜/제목 토글 상태

  // 🔥 Firestore에서 가장 큰 ID 찾기 → 새로운 ID = 가장 큰 ID + 1
  const generateNewId = async (): Promise<number> => {
    const q = query(collection(db, "history"), orderBy("id", "desc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const maxId = snapshot.docs[0].data().id;
      return maxId + 1;
    }
    return 10001;
  };

  // 🔥 Firestore에 새 문서 추가 (history + history_content 생성)
  const handleAddDocument = async () => {
    const newId = await generateNewId();

    await setDoc(doc(db, "history", `${newId}`), {
      id: newId,
      date: "새문서",
      title: "새문서",
      contentId: `content_${newId}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, "history_content", `content_${newId}`), {
      docId: newId,
      content: "새문서",
    });

    console.log("새 문서 추가됨:", newId);
  };

  // 🔥 날짜 기준으로 문서 그룹화
  const groupedByDate = documents.reduce<{ [key: string]: HistoryDocType[] }>((acc, doc) => {
    acc[doc.date] = acc[doc.date] ? [...acc[doc.date], doc] : [doc];
    return acc;
  }, {});

  // 🔥 제목 기준으로 문서 그룹화
  const groupedByTitle = documents.reduce<{ [key: string]: HistoryDocType[] }>((acc, doc) => {
    acc[doc.title] = acc[doc.title] ? [...acc[doc.title], doc] : [doc];
    return acc;
  }, {});

  // 🔄 정렬 기준 변경 (날짜 / 제목 토글)
  const sortedCategories = Object.keys(viewMode === "date" ? groupedByDate : groupedByTitle).sort((a, b) => {
    if (a === "새문서") return -1;
    if (b === "새문서") return 1;
    return sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a);
  });

  return (
    <div className="h-[calc(100vh-190px)] bg-black text-white">
      {/* 🔄 날짜/제목 전환 버튼 */}
      <div className="flex justify-center py-2 border border-gray-600">
        <button
          onClick={() => setViewMode(viewMode === "date" ? "title" : "date")}
          className="text-white px-2 py-1 rounded bg-gray-900 hover:bg-gray-800 text-xl"
        >
          {viewMode === "date" ? "📖 제목 기준으로 정렬" : "📅 날짜 기준으로 정렬"}
        </button>
      </div>

      <div className="flex h-full">
        {/* 🔄 좌측(기본: 날짜) / 우측(기본: 제목) 위치 변경 */}
        <div className={`${viewMode === "date" ? "w-36" : "w-64"} p-4 border-r border-gray-700 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4">
            <div className="ml-2 flex">
              <h2 className="text-xl font-bold">{viewMode === "date" ? "날짜" : "제목"}</h2>

              {/* 🔄 정렬 버튼 */}
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="text-white px-1 py-1 rounded hover:bg-gray-900 w-8 text-sm"
              >
                {sortOrder === "asc" ? "🔽" : "🔼"}
              </button>
            </div>

            {/* 새 문서 추가 버튼 */}
            <button
              onClick={handleAddDocument}
              className="bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800"
            >
              ＋
            </button>
          </div>

          {/* 🔄 날짜 or 제목 리스트 */}
          <ul>
            {sortedCategories.map((category) => (
              <li
                key={category}
                className={`p-2 cursor-pointer rounded text-sm ${
                  selectedCategory === category ? "bg-gray-800" : "hover:bg-gray-900"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        {/* 🔄 우측(기본: 제목) / 좌측(기본: 날짜) 위치 변경 */}
        <div className={`${viewMode === "date" ? "w-64" : "w-36"} p-4 border-r border-gray-700 overflow-y-auto`}>
          <h2 className="text-xl font-bold mb-4">{viewMode === "date" ? "제목" : "날짜"}</h2>
          
          {selectedCategory ? (
            <ul>
              {(viewMode === "date" ? groupedByDate[selectedCategory] : groupedByTitle[selectedCategory])?.map((doc) => (
                <li
                  key={doc.id}
                  className="p-2 cursor-pointer hover:bg-gray-900 rounded text-sm overflow-hidden whitespace-nowrap text-ellipsis"
                  onClick={() => {
                    console.log("문서 선택됨:", doc.id, doc.title);
                    onSelect(doc.id);
                  }}
                  style={{ maxWidth: "100%" }}
                >
                  {viewMode === "date" ? doc.title : doc.date}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">{viewMode === "date" ? "날짜를 선택하세요." : "제목을 선택하세요."}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
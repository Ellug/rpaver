"use client";

import React, { useEffect, useState, useRef } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";
import { formatCreatedAt } from "@/utils/FormatKoreaTime";
import FormatGuide from "@/components/FormateGuide";

interface EditorHeaderProps {
  documentId: number;
  initialTitle: string;
  initialDate: string;
  createdAt: string;
  updatedAt: string;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  documentId,
  initialTitle,
  initialDate,
  createdAt,
  updatedAt,
}) => {
  const [title, setTitle] = useState<string>(initialTitle);
  const [date, setDate] = useState<string>(initialDate);
  const [showHelp, setShowHelp] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!documentId) return;

    // Firestore 실시간 동기화 (history - 제목 및 날짜)
    const historyDocRef = doc(db, "history", `${documentId}`);
    const unsubscribe = onSnapshot(historyDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTitle(data.title || "");
        setDate(data.date || "");
      }
    });

    return () => unsubscribe();
  }, [documentId]);

  // 제목 저장 함수
  const saveTitle = async (newTitle: string) => {
    const historyDocRef = doc(db, "history", `${documentId}`);
    await updateDoc(historyDocRef, { title: newTitle });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveTitle(e.target.value), 1500);
  };

  const handleTitleBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTitle(title);
  };

  // 날짜 저장 함수
  const saveDate = async (newDate: string) => {
    const historyDocRef = doc(db, "history", `${documentId}`);
    await updateDoc(historyDocRef, { date: newDate });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveDate(e.target.value), 1500);
  };

  const handleDateBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveDate(date);
  };

  return (
    <div className="flex justify-between items-center p-4">
      {/* 좌측: 제목 및 날짜 */}
      <div className="flex flex-col gap-2">
        {/* 날짜 입력 필드 */}
        <input
          type="text"
          value={date}
          onChange={handleDateChange}
          onBlur={handleDateBlur}
          className="w-[60%] text-sm text-gray-300 bg-transparent border-none outline-none focus:ring-2 focus:ring-gray-500 px-2 rounded-md"
        />

        {/* 제목 입력 필드 */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          className="md:w-[800px] text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-gray-500 px-2 rounded-md"
        />

        <div className="flex gap-12 text-xs text-gray-500">
          <span>게시: {formatCreatedAt(createdAt)}</span>
          <span>수정: {formatCreatedAt(updatedAt)}</span>
        </div>
      </div>

      {/* 우측: 버튼 그룹 */}
      <div className="flex flex-col items-end gap-4">
        <p className="text-xs text-gray-300">※제목과 날짜를 클릭하면 수정할 수 있습니다. 수정은 실시간 반영됩니다.</p>
        {/* 도움말 버튼 */}
        <div className="relative">
          <button
            className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
            onClick={() => setShowHelp(!showHelp)}
          >
            {showHelp ? "도움말 닫기" : "도움말"}
          </button>
          {showHelp && <FormatGuide show={showHelp} onClose={() => setShowHelp(false)} />}
        </div>
      </div>
    </div>
  );
};

export default EditorHeader;

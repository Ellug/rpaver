"use client";

import React, { useEffect, useState } from "react";
import { doc, updateDoc, onSnapshot, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";
import FormatText from "@/utils/FormatText";

interface EditorBodyProps {
  documentId: number;
}

const EditorBody: React.FC<EditorBodyProps> = ({ documentId }) => {
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>(""); // 원본 내용 저장
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (!documentId) return;

    const contentDocRef = doc(db, "history_content", `content_${documentId}`);
    const unsubscribeContent = onSnapshot(contentDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newContent = data.content || "";

        setContent(newContent);
        setOriginalContent(newContent); // 원본 값 저장
      }
    });

    return () => unsubscribeContent();
  }, [documentId]);

  // 저장
  const saveContent = async () => {
    const contentDocRef = doc(db, "history_content", `content_${documentId}`);
    const historyDocRef = doc(db, "history", `${documentId}`); // history 컬렉션 참조

    await updateDoc(contentDocRef, { content });

    // history 컬렉션에도 업데이트 타임스탬프 기록
    await updateDoc(historyDocRef, { updatedAt: serverTimestamp() });

    setOriginalContent(content); // 저장 후 원본 업데이트
    setIsEditing(false); // 저장 후 편집 종료
  };

  // 삭제
  const handleDelete = async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "history", `${documentId}`));
      await deleteDoc(doc(db, "history_content", `content_${documentId}`));
    }
  };

  // 수정 모드 활성화 (원본 데이터 저장)
  const handleEdit = () => {
    setOriginalContent(content); // 현재 내용을 원본으로 저장
    setIsEditing(true);
  };

  // 수정 취소 (수정 전 내용으로 복원)
  const handleCancel = () => {
    setContent(originalContent);
    setIsEditing(false);
  };

  return (
    <div className="border h-[80%] border-gray-700 p-4 rounded-md relative">
      {/* 본문 (수정/미리보기 전환) */}
      {isEditing ? (
        <textarea
          className="w-full h-full p-2 bg-black border-none focus:outline-none resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요..."
        />
      ) : (
        <div className="p-2 h-full overflow-y-auto">
          <FormatText text={content} />
        </div>
      )}

      {/* 버튼 그룹 */}
      <div className="mt-6 flex gap-2 justify-center">
        {isEditing ? (
          <>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-500" onClick={saveContent}>
              저장
            </button>
            <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500" onClick={handleCancel}>
              취소
            </button>
          </>
        ) : (
          <>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500" onClick={handleEdit}>
              수정
            </button>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-500" onClick={handleDelete}>
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EditorBody;
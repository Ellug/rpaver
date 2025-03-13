"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import Editor from "./components/Editor";
import SideMenu from "./components/SideMenu";
import { db } from "@/libs/firebaseConfig";

const Page: React.FC = () => {
  const [documents, setDocuments] = useState<HistoryDocType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Firestore 실시간 업데이트 감지 (history 컬렉션)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "history"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as HistoryDocType[];

      // console.log("Firestore에서 가져온 문서 목록:", docs);

      setDocuments(docs);
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
  }, []);

  useEffect(() => {
    const storedData = sessionStorage.getItem("selectedData");
    const propsedData = storedData ? JSON.parse(storedData) : null;
    if (propsedData) {
      setSelectedId(propsedData.id);
      setSelectedCategory(propsedData.date);
  
      sessionStorage.removeItem("selectedData"); 
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-130px)]">
      <SideMenu documents={documents} onSelect={setSelectedId} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}  />
      <Editor document={documents.find((doc) => doc.id === selectedId) || null} />
    </div>
  );
};

export default Page;

"use client";

import React, { useState } from "react";
import { collection, query, orderBy, getDocs, serverTimestamp, updateDoc, doc, setDoc, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/libs/firebaseConfig";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingModal from "@/components/LoadingModal";
import FormatGuide from "@/components/FormateGuide";

interface PageData {
  imageUrl: string;
  imageFile: File | null;
  detail: string;
}

export default function AddItemPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [formData, setFormData] = useState({ category: "", name: "" });
  const [pages, setPages] = useState<PageData[]>([{ imageUrl: "", imageFile: null, detail: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showHelp, setShowHelp] = useState(false)
  const [loading, setLoading] = useState<boolean>(false);

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 페이지 추가
  const addPage = () => {
    setPages([...pages, { imageUrl: "", imageFile: null, detail: "" }]);
    setCurrentPage(pages.length);
  };

  // 페이지 삭제
  const removePage = (index: number) => {
    if (pages.length === 1) return;
    if (pages[index].imageUrl) removeImage(pages[index].imageUrl);
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setCurrentPage(Math.max(0, index - 1));
  };

  // 현재 페이지 내용 수정
  const updatePage = (key: keyof PageData, value: PageData[keyof PageData]) => {
    setPages((prevPages) => {
      const newPages = [...prevPages];
      newPages[currentPage] = { ...newPages[currentPage], [key]: value };
      return newPages;
    });
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userData?.uid) {
      alert("로그인이 필요합니다.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    updatePage("imageFile", file);
    updatePage("imageUrl", URL.createObjectURL(file)); // 미리보기
  };

  // 이미지 삭제 핸들러
  const removeImage = async (url: string) => {
    setLoading(true);
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
      updatePage("imageUrl", "");
      updatePage("imageFile", null);
    } catch (error) {
      console.error("🔥 이미지 삭제 오류:", error);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 폼 제출 핸들러 (Firestore 저장 & Storage 업로드)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.name) {
      alert("카테고리와 이름을 입력해주세요.");
      return;
    }
    if (!userData?.uid) {
      alert("로그인이 필요합니다.");
      return;
    }
  
    setLoading(true);
    try {
      // Step 1: 기존 문서들 조회해서 새 ID 계산
      const itemsCollection = collection(db, "items");
      const q = query(itemsCollection, orderBy("id", "desc"), limit(1)); // 최신 1개만!
      const querySnapshot = await getDocs(q);
  
      let newDocId = "i000001";
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0];
        const lastIdNumber = parseInt(lastDoc.id.replace("i", ""), 10);
        newDocId = `i${String(lastIdNumber + 1).padStart(6, "0")}`;
      }
  
      // Step 2: 메타데이터 저장
      const metadataRef = doc(db, "items", newDocId);
      await setDoc(metadataRef, {
        id: newDocId,
        category: formData.category,
        name: formData.name,
        created: serverTimestamp(),
        updatedAt: serverTimestamp(),
        author: userData.uid,
      });
  
      // Step 3: 이미지 업로드 및 pages 생성
      const uploadedPages = await Promise.all(
        pages.map(async (page, index) => {
          let imageUrl = "";
  
          if (page.imageFile) {
            const storagePath = `items/${newDocId}/page${index + 1}_${page.imageFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, page.imageFile);
            imageUrl = await getDownloadURL(storageRef);
          }
  
          return { imageUrl, detail: page.detail };
        })
      );
  
      // Step 4: pages 업데이트
      await updateDoc(metadataRef, { pages: uploadedPages });
  
      alert("아이템이 등록되었습니다.");
      router.back();
    } catch (error) {
      console.error("🔥 아이템 추가 오류:", error);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading && <LoadingModal />}
      <h1 className="text-2xl font-bold mb-4">사전 추가</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 기본 입력 필드 */}
        {["category", "name"].map((name) => (
          <div key={name}>
            <label className="block font-medium">{name === "category" ? "카테고리" : "이름"}</label>
            <input
              type="text"
              name={name}
              value={formData[name as keyof typeof formData]}
              onChange={handleChange}
              className="w-full border px-3 py-2 text-black rounded-md"
              placeholder={`${name === "category" ? "카테고리" : "이름"} 입력`}
            />
          </div>
        ))}

        {/* 현재 페이지 표시 */}
        <div className="mt-4">
          <h2 className="text-lg font-bold">페이지 {currentPage + 1}</h2>

          {/* 이미지 업로드 */}
          <div className="mt-2 relative">
            {pages[currentPage].imageUrl ? (
              <div className="relative w-full">
                <img
                  src={pages[currentPage].imageUrl}
                  alt="업로드된 이미지"
                  className="w-full h-[512px] object-contain border rounded-md"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-sm"
                  onClick={() => removeImage(pages[currentPage].imageUrl)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border px-3 py-2 rounded-md" />
            )}
          </div>

          {/* 설명 입력 */}
          <div className="mt-2">
            {/* 우측: 버튼 그룹 */}
            <div className="flex flex-col items-end gap-4">
              {/* 도움말 버튼 */}
              <div className="relative">
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
                  onClick={() => setShowHelp(!showHelp)}
                >
                  {showHelp ? "도움말 닫기" : "도움말"}
                </button>
                {showHelp && <FormatGuide show={showHelp} onClose={() => setShowHelp(false)} />}
              </div>
            </div>
            <label className="block font-medium">설명</label>
            <textarea
              value={pages[currentPage].detail}
              onChange={(e) => updatePage("detail", e.target.value)}
              className="w-full border px-3 py-2 text-black rounded-md h-80 resize-none"
              placeholder="설명 입력"
            />
          </div>
        </div>

        {/* 페이지 버튼 */}
        <div className="flex gap-2 mt-4">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`px-4 py-2 rounded-md ${currentPage === index ? "bg-blue-900 text-white" : "bg-gray-800"}`}
              onClick={() => setCurrentPage(index)}
            >
              {index + 1}
            </button>
          ))}
          <button type="button" onClick={addPage} className="px-4 py-2 bg-green-500 text-white rounded-md">
            ＋
          </button>
          {pages.length > 1 && (
            <button
              type="button"
              onClick={() => removePage(currentPage)}
              className="px-4 py-2 bg-red-500 text-white rounded-md"
            >
              🗑
            </button>
          )}
        </div>

        {/* 등록 버튼 */}
        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition disabled:bg-gray-400" disabled={loading}>
          {loading ? "등록 중..." : "등록"}
        </button>
      </form>
    </div>
  );
}

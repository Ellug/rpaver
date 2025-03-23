"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/libs/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import LoadingModal from "@/components/LoadingModal";
import FormatGuide from "@/components/FormateGuide";

interface PageData {
  imageUrl: string;
  imageFile: File | null;
  detail: string;
}

export default function EditItemPage() {
  const router = useRouter();
  const { id } = useParams(); // URL에서 `id` 가져오기
  const { userData } = useAuth();
  const [formData, setFormData] = useState({ category: "", name: "" });
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showHelp, setShowHelp] = useState(false)
  const [loading, setLoading] = useState<boolean>(true);

  // 🔹 Firestore에서 기존 데이터 불러오기
  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "items", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({ category: data.category, name: data.name });
          setPages(data.pages || [{ imageUrl: "", imageFile: null, detail: "" }]);
        } else {
          alert("문서를 찾을 수 없습니다.");
          router.back();
        }
      } catch (error) {
        console.error("🔥 데이터 로딩 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 🔹 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 페이지 추가
  const addPage = () => {
    setPages([...pages, { imageUrl: "", imageFile: null, detail: "" }]);
    setCurrentPage(pages.length);
  };

  // 🔹 페이지 삭제
  const removePage = (index: number) => {
    if (pages.length === 1) return;
    if (pages[index].imageUrl) removeImage(pages[index].imageUrl);
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setCurrentPage(Math.max(0, index - 1));
  };

  // 🔹 현재 페이지 내용 수정
  const updatePage = (key: keyof PageData, value: PageData[keyof PageData]) => {
    setPages((prevPages) => {
      const newPages = [...prevPages];
      newPages[currentPage] = { ...newPages[currentPage], [key]: value };
      return newPages;
    });
  };

  // 🔹 이미지 업로드 핸들러
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

  // 🔹 이미지 삭제 핸들러
  const removeImage = async (url: string) => {
    setLoading(true);
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
      updatePage("imageUrl", "");
      updatePage("imageFile", null);
    } catch (error) {
      console.error("🔥 이미지 삭제 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Firestore 문서 업데이트
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.name) {
      alert("카테고리와 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, "items", id as string);

      // 🔹 Storage 업로드 후 `pages` 배열 업데이트
      const updatedPages = await Promise.all(
        pages.map(async (page, index) => {
          let imageUrl = page.imageUrl;

          // 🔹 새로운 이미지가 업로드되었을 경우 Storage에 저장 후 URL 업데이트
          if (page.imageFile) {
            const storagePath = `items/${id}/page${index + 1}_${page.imageFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, page.imageFile);
            imageUrl = await getDownloadURL(storageRef);
          }

          return { imageUrl, detail: page.detail };
        })
      );

      // 🔹 Firestore 문서 업데이트
      await updateDoc(docRef, {
        category: formData.category,
        name: formData.name,
        updatedAt: serverTimestamp(),
        pages: updatedPages,
      });

      alert("사전이 수정되었습니다.");
      router.back();
    } catch (error) {
      console.error("🔥 사전 수정 오류:", error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading && <LoadingModal />}
      <h1 className="text-2xl font-bold mb-4">사전 편집</h1>

      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
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
            />
          </div>
        ))}

        {/* 현재 페이지 표시 */}
        <div className="mt-4">
          <h2 className="text-lg font-bold">페이지 {currentPage + 1}</h2>

          {/* 이미지 업로드 */}
          <div className="mt-2 relative">
            {pages[currentPage]?.imageUrl ? (
              <div className="relative w-full">
                <img src={pages[currentPage].imageUrl} alt="업로드된 이미지" className="w-full h-[512px] object-contain border rounded-md" />
                <button type="button" className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-sm" onClick={() => removeImage(pages[currentPage].imageUrl)}>
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
            <textarea value={pages[currentPage]?.detail} onChange={(e) => updatePage("detail", e.target.value)} className="w-full border px-3 py-2 text-black rounded-md h-32 resize-none" />
          </div>
        </div>

        {/* 페이지 버튼 (이동, 추가, 삭제) */}
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

        {/* 업데이트 버튼 */}
        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-md">수정하기</button>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/libs/firebaseConfig";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingModal from "@/components/LoadingModal";

export default function AddItemPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    detail: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 이미지 선택 핸들러 (여러 개 추가 가능)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...selectedFiles]);
      setPreviewUrls((prev) => [
        ...prev,
        ...selectedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    }
  };

  // 이미지 개별 삭제 핸들러
  const handleImageDelete = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.name || !formData.detail) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    if (!userData?.uid) {
      alert("로그인이 필요합니다.");
      return;
    }
  
    setLoading(true);
  
    try {
      // Firestore에 아이템 정보 먼저 저장 (문서 ID 확보)
      const docRef = await addDoc(collection(db, "items"), {
        ...formData,
        created: Timestamp.now(),
        author: userData.uid, 
      });
  
      // 이미지 여러 개 업로드 (Storage: `items/{문서ID}/{파일명}`)
      await Promise.all(
        images.map(async (image) => {
          const storageRef = ref(storage, `items/${docRef.id}/${image.name}`);
          await uploadBytes(storageRef, image);
        })
      );
  
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
      <h1 className="text-2xl font-bold mb-4">아이템 추가</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 입력 필드 목록 */}
        {[
          { label: "카테고리", name: "category", type: "text", placeholder: "카테고리 입력" },
          { label: "이름", name: "name", type: "text", placeholder: "이름 입력" },
        ].map(({ label, name, type, placeholder }) => (
          <div key={name}>
            <label className="block font-medium">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name as keyof typeof formData]}
              onChange={handleChange}
              className="w-full border px-3 py-2 text-black rounded-md"
              placeholder={placeholder}
            />
          </div>
        ))}

        {/* 설명 입력 */}
        <div>
          <label className="block font-medium">설명</label>
          <textarea
            name="detail"
            value={formData.detail}
            onChange={handleChange}
            className="w-full border px-3 py-2 text-black rounded-md h-64 resize-none"
            placeholder="설명 입력"
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block font-medium">이미지 업로드</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border px-3 py-2 rounded-md" />

          {/* 🔹 이미지 미리보기 및 삭제 버튼 */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt={`이미지 ${index + 1}`} className="w-full h-32 object-cover rounded-md border" />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 rounded-bl-md"
                  onClick={() => handleImageDelete(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 등록 버튼 */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </form>
    </div>
  );
}
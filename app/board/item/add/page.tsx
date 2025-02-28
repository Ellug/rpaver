"use client";

import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/libs/firebaseConfig";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";


export default function AddItemPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    detail: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 🔹 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0])); // 미리보기용 URL
    }
  };

  // 🔹 이미지 삭제 핸들러
  const handleImageDelete = () => {
    setImage(null);
    setImageUrl(null);
  };

  // 🔹 폼 제출 핸들러
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
    let uploadedImageUrl = null;

    try {
      // 🔹 이미지 업로드 (Storage: `items/{name}/{파일명}`)
      if (image) {
        const storageRef = ref(storage, `items/${formData.name}/${image.name}`);
        await uploadBytes(storageRef, image);
        uploadedImageUrl = await getDownloadURL(storageRef);
      }

      // 🔹 Firestore에 아이템 정보 저장
      await addDoc(collection(db, "items"), {
        ...formData,
        imageUrl: uploadedImageUrl,
        created: Timestamp.now(),
        author: userData.uid, // 🔹 현재 로그인한 사용자 UID 추가
      });

      alert("아이템이 등록되었습니다.");
      router.push("/board/item"); // 등록 후 목록 페이지로 이동
    } catch (error) {
      console.error("🔥 아이템 추가 오류:", error);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">아이템 추가</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 🔹 입력 필드 목록 */}
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

        {/* 🔹 설명 입력 */}
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

        {/* 🔹 이미지 업로드 */}
        <div>
          <label className="block font-medium">이미지 업로드</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border px-3 py-2 rounded-md" />

          {/* 🔹 이미지 미리보기 */}
          {imageUrl && (
            <div className="mt-2">
              <img src={imageUrl} alt="이미지 미리보기" className="w-full h-40 object-cover rounded-md border" />
              <button type="button" onClick={handleImageDelete} className="mt-2 text-red-600 underline">
                이미지 제거
              </button>
            </div>
          )}
        </div>

        {/* 🔹 등록 버튼 */}
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
"use client";

import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/libs/firebaseConfig";
import { storage } from "@/libs/firebaseConfig"; // Storage 가져오기
import { useRouter } from "next/navigation";

export default function AddItemPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [detail, setDetail] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);

      // 미리보기용 URL 생성
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setImageUrl(previewUrl);
    }
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = () => {
    setImage(null);
    setImageUrl(null);
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name || !detail) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    setLoading(true);
    let uploadedImageUrl = null;

    try {
      // 이미지 업로드 (Storage: items/{name}/파일명)
      if (image) {
        const storageRef = ref(storage, `items/${name}/${image.name}`);
        await uploadBytes(storageRef, image);
        uploadedImageUrl = await getDownloadURL(storageRef);
      }

      // Firestore에 아이템 정보 저장
      await addDoc(collection(db, "items"), {
        category,
        name,
        detail,
        imageUrl: uploadedImageUrl, // 이미지 URL 추가
        created: Timestamp.now(),
      });

      alert("아이템이 등록되었습니다.");
      router.push("/board/item"); // 등록 후 목록 페이지로 이동
    } catch (error) {
      console.error("아이템 추가 오류:", error);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">아이템 추가</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 카테고리 입력 */}
        <div>
          <label className="block font-medium">카테고리</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border px-3 py-2 text-black rounded-md"
            placeholder="카테고리 입력"
          />
        </div>

        {/* 이름 입력 */}
        <div>
          <label className="block font-medium">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 text-black rounded-md"
            placeholder="이름 입력"
          />
        </div>

        {/* 설명 입력 */}
        <div>
          <label className="block font-medium">설명</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="w-full border px-3 py-2 text-black rounded-md h-24 resize-none"
            placeholder="설명 입력"
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block font-medium">이미지 업로드</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border px-3 py-2 rounded-md" />

          {/* 이미지 미리보기 */}
          {imageUrl && (
            <div className="mt-2">
              <img src={imageUrl} alt="이미지 미리보기" className="w-full h-40 object-cover rounded-md border" />
              <button
                type="button"
                onClick={handleImageDelete}
                className="mt-2 text-red-600 underline"
              >
                이미지 제거
              </button>
            </div>
          )}
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
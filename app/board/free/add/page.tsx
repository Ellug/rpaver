"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/libs/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import TiptapEditor from "@/components/TiptapEditor";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import LoadingModal from "@/components/LoadingModal";

export default function AddPostPage() {
  const router = useRouter();
  const { userData } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 이미지 업로드 파일 저장 + 에디터에 삽입
  const handleImageUpload = (files: FileList | null, insertImage: (url: string) => void) => {
    if (!files) return;
    const newFiles = Array.from(files);
  
    setImageFiles((prev) => [...prev, ...newFiles]);
  
    // 🔥 로컬 URL을 만들어 에디터에 미리보기 삽입
    newFiles.forEach((file) => {
      const localUrl = URL.createObjectURL(file);
      insertImage(localUrl);
    });
  };

  // 🔹 Firebase Storage 업로드 및 URL 변환
  const uploadImages = async () => {
    const uploadedImageUrls: string[] = [];
    for (const file of imageFiles) {
      const imageRef = ref(storage, `postImages/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      uploadedImageUrls.push(imageUrl);
    }
    return uploadedImageUrls;
  };

  // 🔹 게시글 업로드 함수
  const handleSubmit = async () => {
    if (!userData) return alert("로그인이 필요합니다.");
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력하세요.");
    setLoading(true);
  
    try {
      const imageUrls = await uploadImages(); // 🔥 Firebase Storage에 업로드 후 URL 리스트 받기
      let finalContent = content;
  
      // 🔥 본문 내 로컬 이미지 URL을 Firebase Storage URL로 변경
      imageUrls.forEach((url, index) => {
        const localUrl = URL.createObjectURL(imageFiles[index]);
        finalContent = finalContent.replace(localUrl, url);
      });
  
      // 🔥 Firestore에 게시글 저장 (이미지 URL 목록 포함)
      await addDoc(collection(db, "free_board"), {
        title,
        content: finalContent,
        author: userData.uid,
        images: imageUrls,
        views: 0,
        likes: [],
        comments: [],
        createdAt: Timestamp.now(),
      });
  
      alert("게시글이 등록되었습니다.");
      router.back();
    } catch (error) {
      console.error("🔥 게시글 업로드 실패:", error);
    } finally {
      setLoading(false);
      setImageFiles([]); // 업로드 후 이미지 목록 초기화
    }
  };
  

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      {loading && <LoadingModal />}

      <h1 className="text-2xl font-bold mb-4">새 게시글 작성</h1>

      {/* 🔹 제목 입력 */}
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 rounded-md"
      />

      {/* 🔹 본문 입력 */}
      <TiptapEditor content={content} onChange={setContent} onImageUpload={handleImageUpload} />

      {/* 🔹 게시 버튼 */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-32 p-2 bg-blue-600 rounded-md hover:bg-blue-500 transition"
        >
          게시
        </button>
      </div>
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "@/libs/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import TiptapEditor from "@/components/TiptapEditor";
import LoadingModal from "@/components/LoadingModal";

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userData } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "free_board", id as string);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          alert("게시글을 찾을 수 없습니다.");
          router.back();
          return;
        }

        const postData = docSnap.data();

        if (postData.author !== userData?.uid && !userData?.admin) {
          alert("수정 권한이 없습니다.");
          router.back();
          return;
        }

        setTitle(postData.title);
        setContent(postData.content);
      } catch (error) {
        console.error("🔥 게시글 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, userData]);

  // 🔹 이미지 업로드 파일 저장 + 에디터에 삽입
  const handleImageUpload = (files: FileList | null, insertImage: (url: string) => void) => {
    if (!files) return;
    const newFiles = Array.from(files);

    setNewImages((prev) => [...prev, ...newFiles]);

    // 🔥 로컬 URL을 만들어 에디터에 미리보기 삽입
    newFiles.forEach((file) => {
      const localUrl = URL.createObjectURL(file);
      insertImage(localUrl);
    });
  };

  // 🔹 Firebase Storage 업로드 및 URL 변환
  const uploadNewImages = async () => {
    const uploadedImageUrls: string[] = [];
    for (const file of newImages) {
      const imageRef = ref(storage, `postImages/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      uploadedImageUrls.push(imageUrl);
    }
    return uploadedImageUrls;
  };

  // 이미지가 이상한 blob URL로 저장되는 현상 있음. 도저히 오늘 못하겠다 나중에 해결할랜다.
  // 🔹 게시글 수정 함수
  const handleUpdate = async () => {
    if (!userData) return alert("로그인이 필요합니다.");
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력하세요.");
    setLoading(true);
  
    try {
      const docRef = doc(db, "free_board", id as string);
  
      // 🔹 현재 수정된 본문에서 사용 중인 이미지 URL 추출
      const regex = /<img[^>]+src="([^">]+)"/g;
      let match;
      let updatedContent = content;
      const currentImages: string[] = [];
  
      while ((match = regex.exec(updatedContent)) !== null) {
        currentImages.push(match[1]);
      }
  
      // 🔹 Firebase Storage에 새 이미지 업로드 (blob: URL 변환)
      const newImageUrls = await uploadNewImages();
      newImages.forEach((file, index) => {
        const localUrl = URL.createObjectURL(file);
        updatedContent = updatedContent.replace(localUrl, newImageUrls[index]);
      });
  
      // 🔹 Firestore 업데이트 (최종 이미지 반영)
      await updateDoc(docRef, {
        title,
        content: updatedContent,
        images: [...currentImages, ...newImageUrls],
      });
  
      alert("게시글이 수정되었습니다.");
      router.push(`/board/free/detail/${id}`);
    } catch (error) {
      console.error("🔥 게시글 수정 실패:", error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setNewImages([]); // 🔥 업로드 후 이미지 목록 초기화
    }
  };  

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      {loading && <LoadingModal />}

      <h1 className="text-2xl font-bold mb-4">게시글 수정</h1>

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
          onClick={handleUpdate}
          disabled={loading}
          className="w-32 p-2 bg-blue-600 rounded-md hover:bg-blue-500 transition"
        >
          {loading ? "업데이트 중..." : "수정 완료"}
        </button>
      </div>
    </div>
  );
}
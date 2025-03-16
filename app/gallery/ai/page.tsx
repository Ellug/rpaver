"use client";

import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/libs/firebaseConfig';
import { ref, deleteObject } from 'firebase/storage';
import LoadingModal from '@/components/LoadingModal';
import { useRouter } from 'next/navigation';
import { useUserContext } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";

type ImageData = {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  uid: string;
};

const VertextGalleryPage = () => {
  const router = useRouter();
  const { users } = useUserContext();
  const { userData } = useAuth();
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Masonry 핵심 함수
  const resizeAllGridItems = () => {
    const grid = gridRef.current;
    if (!grid) return;

    const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('gap'));

    grid.querySelectorAll('.grid-item').forEach((item) => {
      const content = item.querySelector('.content') as HTMLImageElement;
      if (!content) return;
      const rowSpan = Math.ceil((content.offsetHeight + rowGap) / (rowHeight + rowGap));
      (item as HTMLElement).style.gridRowEnd = `span ${rowSpan}`;
      (item as HTMLElement).style.visibility = 'visible';
    });
  };

  // 이미지 불러오기
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const q = query(collection(db, 'generator'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedImages: ImageData[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            imageUrl: data.imageUrl,
            prompt: data.prompt,
            createdAt: data.createdAt,
            uid: data.uid,
          };
        });

        setImages(fetchedImages);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  // 이미지 변경시 재정렬
  useEffect(() => {
    const timer = setTimeout(() => {
      resizeAllGridItems();
    }, 300); // 약간의 delay 필요

    window.addEventListener('resize', resizeAllGridItems);
    setIsLoading(false);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resizeAllGridItems);
    };
  }, [images]);

  // 프롬프트 재사용
  const handleReusePrompt = (prompt: string) => {
    sessionStorage.setItem("reusePrompt", prompt);
    router.push("/play/vertexai");
  };

  // 삭제 기능
  const handleDelete = async (image: ImageData) => {
    if (!userData) {
      alert("로그인이 필요합니다.");
      return;
    }

    const isAuthor = userData.uid === image.uid;
    const isAdmin = userData.admin;

    if (!isAuthor && !isAdmin) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    const confirm = window.confirm("정말로 이 이미지를 삭제하시겠습니까?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "generator", image.id));

      const fileName = image.imageUrl.split('%2F').pop()?.split('?')[0];
      const storageRef = ref(storage, `generator/${image.uid}/${fileName}`);
      await deleteObject(storageRef);

      setImages((prev) => prev.filter((img) => img.id !== image.id));
      setSelectedImage(null);

      alert("삭제 완료");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-6 w-full">
      {isLoading && <LoadingModal />}

      <div
        ref={gridRef}
        className="grid grid-cols-2 md:grid-cols-5 gap-6 auto-rows-[8px]"
      >
        {images.map((image) => (
          <div key={image.id} className="grid-item overflow-hidden rounded-md invisible">
            <img
              src={image.imageUrl}
              alt={image.prompt}
              loading="lazy"
              className="content w-full hover:scale-[1.02] cursor-pointer"
              onLoad={resizeAllGridItems}
              onClick={() => setSelectedImage(image)}
            />
          </div>
        ))}
      </div>

      {/* 모달 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 p-4">
          <img src={selectedImage.imageUrl} alt={selectedImage.prompt} className="max-w-xl max-h-[60vh] rounded-md border border-gray-700 mb-8" />
          
          {/* 작성자 정보 */}
          <div className="flex items-center gap-2 mb-2">
            {users[selectedImage.uid]?.picture ? (
              <img src={users[selectedImage.uid].picture} alt={users[selectedImage.uid].name} className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-600" />
            )}
            <span className="text-xl text-gray-300">{users[selectedImage.uid]?.name || "Unknown"}</span>

            <p className="text-gray-400 ml-8">{new Date(selectedImage.createdAt.seconds * 1000).toLocaleString()}</p>
          </div>

          <p className="w-[60%] text-white text-center my-8"><strong>Prompt:</strong> {selectedImage.prompt}</p>

          <div className="flex gap-4">
            <button
              onClick={() => handleReusePrompt(selectedImage.prompt)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-md hover:opacity-90 transition"
            >
              이 프롬프트로 생성하기
            </button>

            {(userData?.uid === selectedImage.uid || userData?.admin) && (
              <button
                onClick={() => handleDelete(selectedImage)}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:opacity-90 transition"
              >
                삭제
              </button>
            )}

            <button
              onClick={() => setSelectedImage(null)}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:opacity-80 transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VertextGalleryPage;
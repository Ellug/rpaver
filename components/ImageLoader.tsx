"use client";

import React, { useEffect, useState } from "react";
import { storage } from "@/libs/firebaseConfig";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import LoadingModal from "./LoadingModal";

type ImageLoaderProps = {
  character: {
    name: string;
    family: string;
  };
  onClose: () => void;
};

export default function ImageLoader({ character, onClose }: ImageLoaderProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 모달이 열릴 때 배경 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // 🔹 스토리지에서 '힣힣힣' 폴더의 이미지 가져오기
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const folderRef = ref(storage, "charactersIMG/힣힣힣/");
        const result = await listAll(folderRef);
        const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));
        setImageUrls(urls);
      } catch (error) {
        console.error("🔥 이미지 불러오기 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // 🔹 이미지 선택/해제 토글
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(imageUrl)
        ? prevSelected.filter((img) => img !== imageUrl) // 선택 해제
        : [...prevSelected, imageUrl] // 선택
    );
  };

  // 🔹 불러오기 버튼 클릭 시 이미지 이동 요청
  const handleMoveImages = async () => {
    if (selectedImages.length === 0) {
      alert("📌 이동할 이미지를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const oldPaths = selectedImages.map((url) => {
        const fileName = url.split("%2F").pop()?.split("?")[0]; // URL에서 파일명 추출
        return {
          oldPath: `charactersIMG/힣힣힣/${fileName}`,
          newPath: `charactersIMG/${character.name} ${character.family}/${fileName}`,
        };
      });

      const response = await fetch("/api/moveFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: oldPaths }),
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ 이미지가 정상적으로 이동되었습니다.");
        onClose();
      } else {
        alert(`⚠️ 이동 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("🔥 이미지 이동 오류:", error);
      alert("❌ 이미지 이동 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg text-white shadow-lg w-full h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-4">불러올 이미지를 선택하세요</h2>

        {/* 🔹 이미지 목록을 스크롤 가능하도록 max-height & overflow 설정 */}
        <div className="flex-1 overflow-y-auto border border-gray-700 rounded-md p-2">
          {loading ? (
            <LoadingModal />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imageUrls.length > 0 ? (
                imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className={`relative border-4 rounded-md cursor-pointer ${
                      selectedImages.includes(url) ? "border-blue-500" : "border-gray-700"
                    }`}
                    onClick={() => toggleImageSelection(url)}
                  >
                    <img src={url} alt={`Image ${index}`} className="w-full object-contain rounded-md" />
                    {selectedImages.includes(url) && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white px-2 py-1 text-sm rounded-bl-md">
                        ✔ 선택됨
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-300 text-center col-span-3">이미지가 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 🔹 버튼 그룹 */}
        <div className="flex justify-end gap-4 mt-6 mr-6">
          <button
            onClick={handleMoveImages}
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition"
            disabled={selectedImages.length === 0}
          >
            {loading ? "이동 중..." : "불러오기"}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
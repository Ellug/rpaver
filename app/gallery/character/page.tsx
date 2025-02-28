"use client";

import React, { useState, useEffect } from "react";
import { storage } from "@/libs/firebaseConfig";
import { ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import ImageModal from "@/components/ImageModal"; 
import { useCharacterContext } from "@/contexts/CharacterContext"; 
import { useRouter } from "next/navigation";

export default function CharacterGallery() {
  const router = useRouter();
  const { characters } = useCharacterContext(); // 🔹 Firestore에서 불러온 캐릭터 정보
  const [gallery, setGallery] = useState<{ folder: string; images: string[] }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

  // 🔹 캐릭터 이미지 가져오기
  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      try {
        const storageRef = ref(storage, "charactersIMG/");
        const folderList = await listAll(storageRef);

        const galleryData = await Promise.all(
          folderList.prefixes.map(async (folderRef) => {
            const folderName = folderRef.name;
            const imageList = await listAll(folderRef);

            // 🔹 각 폴더 안의 이미지 URL 가져오기
            const images = await Promise.all(
              imageList.items.map(async (imageRef) => await getDownloadURL(imageRef))
            );

            return { folder: folderName, images };
          })
        );

        setGallery(galleryData);
      } catch (error) {
        console.error("🔥 갤러리 가져오기 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  // 🔹 클릭 시 해당 캐릭터의 ID를 찾아서 상세 페이지로 이동
  const handleCharacterClick = (folderName: string) => {
    const matchedCharacter = characters.find(
      (char) => char.family ? `${char.name} ${char.family}` === folderName : char.name === folderName
    );

    if (matchedCharacter) {
      router.push(`/board/character/detail/${matchedCharacter.id}`);
    } else {
      alert("⚠️ 해당 캐릭터의 ID를 찾을 수 없습니다.");
    }
  };

  // 🔹 "힣힣힣" 폴더만 토글 가능
  const handleToggle = (folder: string) => {
    if (folder === "힣힣힣") {
      setExpandedFolders((prev) => ({
        ...prev,
        [folder]: !prev[folder],
      }));
    }
  };

  // 🔹 이미지 업로드 핸들러 (힣힣힣 폴더 전용)
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);

    setIsLoading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(storage, `charactersIMG/힣힣힣/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const newUrls = await Promise.all(uploadPromises);
      setGallery((prevGallery) =>
        prevGallery.map((folderData) =>
          folderData.folder === "힣힣힣"
            ? { ...folderData, images: [...folderData.images, ...newUrls] }
            : folderData
        )
      );
      event.target.value = "";
    } catch (error) {
      console.error("🔥 이미지 업로드 실패:", error);
    }
    setIsLoading(false)
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-7xl mx-auto">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold mb-4">캐릭터 갤러리</h1>
        <div>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-500 transition">
            저장소에 업로드
            <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : gallery.length === 0 ? (
        <p className="text-gray-400">저장된 캐릭터 이미지가 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {gallery.map(({ folder, images }) => (
            <div key={folder} className="border border-gray-700 p-4 rounded-lg">
              {/* 🔹 캐릭터 이름 클릭 시 상세 페이지 이동 */}
              <h2
                className={`text-2xl font-semibold mb-2 cursor-pointer hover:text-gold ${
                  folder === "힣힣힣" ? "text-blue-400" : "text-gray-300"
                }`}
                onClick={() => {
                  if (folder === "힣힣힣") {
                    handleToggle(folder);
                  } else {
                    handleCharacterClick(folder);
                  }
                }}
              >
                {folder} {folder === "힣힣힣" && (expandedFolders[folder] ? "저장소 🔽" : "저장소 ▶")}
              </h2>

              {(folder !== "힣힣힣" || expandedFolders[folder]) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.length > 0 ? (
                    images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`캐릭터 ${index}`}
                        className="w-full object-contain rounded-md border border-gray-600 cursor-pointer transition hover:scale-105"
                        onClick={() => setSelectedImage(image)}
                      />
                    ))
                  ) : (
                    <p className="text-gray-400">이미지 없음</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🔹 선택된 이미지가 있을 경우 모달 표시 */}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}
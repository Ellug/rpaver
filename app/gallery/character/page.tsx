"use client";

import React, { useState, useEffect, useRef } from "react";
import ImageModal from "@/components/ImageModal";
import { useCharacterContext } from "@/contexts/CharacterContext";
import { useRouter } from "next/navigation";
import LoadingModal from "@/components/LoadingModal";
import { fetchGalleryFromStorage } from "@/utils/Storage";
import { ArrowDown, ArrowUp } from "lucide-react";

export default function CharacterGallery() {
  const router = useRouter();
  const { characters } = useCharacterContext();
  const [gallery, setGallery] = useState<{ folder: string; images: string[] }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCharacterList, setShowCharacterList] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 캐릭터 이미지 가져오기
  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      const data = await fetchGalleryFromStorage("charactersIMG/");
      setGallery(data);
      setIsLoading(false);
    };

    fetchGallery();
  }, []);

  // 클릭 시 해당 캐릭터의 ID를 찾아서 상세 페이지로 이동
  const handleCharacterClick = (folderName: string) => {
    const matchedCharacter = characters.find(
      (char) => (char.family ? `${char.name} ${char.family}` : char.name) === folderName
    );

    if (matchedCharacter) {
      router.push(`/board/character/detail/${matchedCharacter.id}`);
    } else {
      alert("⚠️ 해당 캐릭터의 ID를 찾을 수 없습니다.");
    }
  };

  // 특정 캐릭터 섹션으로 스크롤 이동
  const scrollToCharacter = (folderName: string) => {
    if (sectionRefs.current[folderName]) {
      sectionRefs.current[folderName]?.scrollIntoView({ behavior: "smooth", block: "start" });
      setShowCharacterList(false); // 목록 닫기
    }
  };

  // 페이지 맨 위로 이동
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 페이지 맨 아래로 이동
  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };
  

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-7xl mx-auto relative">
      {isLoading && <LoadingModal />}

      <h1 className="text-2xl font-bold mb-4">캐릭터 갤러리</h1>

      <div className="space-y-6">
        {gallery.map(({ folder, images }) => (
          <div
            key={folder}
            ref={(el) => {
              sectionRefs.current[folder] = el;
            }}
            className="border border-gray-700 p-4 rounded-lg"
          >
            {/* 캐릭터 이름 클릭 시 상세 페이지 이동 */}
            <h2
              className="text-2xl font-semibold mb-2 cursor-pointer hover:text-gold text-gray-300"
              onClick={() => handleCharacterClick(folder)}
            >
              {folder}
            </h2>

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
          </div>
        ))}
      </div>

      {/* FAB 버튼 & 리스트 팝업 (한 몸처럼 디자인) */}
      <div className="fixed bottom-0 md:bottom-4 right-0 md:right-4 flex flex-col items-end">
        {/* 캐릭터 리스트 팝업 */}
        {showCharacterList && (
          <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-xl max-h-[400px] md:max-h-[600px] overflow-y-auto transform transition-all duration-300">
                        <h3 className="text-lg font-bold mb-2 flex justify-between items-center">
              캐릭터 목록
              <div className="flex space-x-2">
                <button
                  onClick={scrollToTop}
                  className="p-1 bg-gray-700 rounded-md hover:bg-gray-600 transition"
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  onClick={scrollToBottom}
                  className="p-1 bg-gray-700 rounded-md hover:bg-gray-600 transition"
                >
                  <ArrowDown size={18} />
                </button>
              </div>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {gallery.map(({ folder }) => (
                <button
                  key={folder}
                  onClick={() => scrollToCharacter(folder)}
                  className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-600 transition"
                >
                  {folder}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAB 버튼 */}
        <div
          ref={fabRef}
          className={`select-none touch-none relative bg-gradient-to-r from-blue-500 to-purple-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-transform transform ${
            showCharacterList ? "rotate-90" : "rotate-0"
          } hover:scale-110`}
          onClick={() => setShowCharacterList(!showCharacterList)}
        >
          <span className="text-xl">{showCharacterList ? "✖" : "🔍"}</span>
        </div>
      </div>

      {/* 선택된 이미지가 있을 경우 모달 표시 */}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}

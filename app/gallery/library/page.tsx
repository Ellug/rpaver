"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import ImageModal from "@/components/ImageModal";
import { useCharacterContext } from "@/contexts/CharacterContext";
import { useRouter } from "next/navigation";
import LoadingModal from "@/components/LoadingModal";
import { fetchFoldersFromStorage, fetchImagesFromStorage } from "@/utils/Storage";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useImageNavigator } from "@/utils/useImageNavigator";
import { downloadAlbum } from "@/utils/downloadZip";


export default function CharacterGalleryLibrary() {
  const router = useRouter();
  const { characters } = useCharacterContext();
  const [folders, setFolders] = useState<string[]>([]);
  const [gallery, setGallery] = useState<{ [folder: string]: string[] }>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCharacterList, setShowCharacterList] = useState(false);
  const [renderedIndexes, setRenderedIndexes] = useState<{ [folder: string]: Set<number> }>({});
  const [showToastFor, setShowToastFor] = useState<string | null>(null);
  
  const fabRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const imageGroups = useMemo(() => {
    return folders.map((folder) => gallery[folder] || []);
  }, [folders, gallery]);

  const { selectedItem, open, close, next, prev } = useImageNavigator<string>(imageGroups);

  // 캐릭터 목록(폴더) 가져오기
  useEffect(() => {
    const fetchFolders = async () => {
      setIsLoading(true);
      const folderNames = await fetchFoldersFromStorage("charactersIMG/");
      setFolders(folderNames);
      setIsLoading(false);
    };

    fetchFolders();
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

  // 폴더 토글 오픈
  const toggleFolder = async (folderName: string) => {
    if (!gallery[folderName]) {
      const images = await fetchImagesFromStorage(`charactersIMG/${folderName}/`);
      setGallery((prev) => ({ ...prev, [folderName]: images }));
    }

    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName);
      } else {
        newSet.add(folderName);
      }
      return newSet;
    });
  };

  // 이미지 로드 핸들러
  const handleImageLoad = (folder: string, index: number) => {
    setRenderedIndexes(prev => {
      const currentSet = new Set(prev[folder] || []);
      currentSet.add(index);
      return { ...prev, [folder]: currentSet };
    });
  };

  const handleImageClick = (folder: string, folderIndex: number, index: number) => {
    const total = gallery[folder]?.length || 0;
    const rendered = renderedIndexes[folder]?.size || 0;

    if (rendered === total) {
      open(folderIndex, index);
    } else {
      setShowToastFor(folder);
      setTimeout(() => setShowToastFor(null), 3000);
    }
  };

  // 특정 캐릭터 섹션으로 스크롤 이동
  const scrollToCharacter = (folderName: string) => {
    if (sectionRefs.current[folderName]) {
      sectionRefs.current[folderName]?.scrollIntoView({ behavior: "smooth", block: "start" });
      setShowCharacterList(false); // 목록 닫기
    }
  };

  // 페이지 스크롤
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });  

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-7xl mx-auto relative">
      {isLoading && <LoadingModal />}

      <h1 className="text-2xl font-bold mb-4">캐릭터 갤러리</h1>

      <div className="space-y-6">
        {folders.map((folder, folderIndex) => (
          <div
            key={folder}
            ref={(el) => {
              sectionRefs.current[folder] = el;
            }}
            className="border border-gray-700 p-4 rounded-lg"
          >
            <div className="flex justify-between items-center mb-2">
              <h2
                className="text-2xl font-semibold cursor-pointer hover:text-gold text-gray-300"
                onClick={() => handleCharacterClick(folder)}
              >
                {folder}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadAlbum(folder, gallery[folder] || [])}
                  className="text-sm bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 transition"
                >
                  앨범 다운로드
                </button>
                <button
                  onClick={() => toggleFolder(folder)}
                  className="text-sm bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 transition"
                >
                  {expandedFolders.has(folder) ? "이미지 닫기" : "이미지 보기"}
                </button>
              </div>
            </div>

            {expandedFolders.has(folder) && (
              <>
                {/* 프로그레스 바 */}
                <div className="w-full bg-gray-700 rounded-full h-1 mb-3">
                  <div
                    className="bg-green-400 h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${(renderedIndexes[folder]?.size || 0) / (gallery[folder]?.length || 1) * 100}%`
                    }}
                  />
                </div>

                {showToastFor === folder && (
                  <div className="mb-2 bg-black bg-opacity-70 text-red-400 text-sm px-4 py-2 rounded shadow-lg">
                    이미지가 아직 모두 로딩되지 않았습니다.
                  </div>
                )}

                {/* 이미지 목록 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {gallery[folder]?.length > 0 ? (
                    gallery[folder].map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`캐릭터 ${index}`}
                        onLoad={() => handleImageLoad(folder, index)}
                        onClick={() => handleImageClick(folder, folderIndex, index)}
                        className="cursor-pointer"
                      />
                    ))
                  ) : (
                    <p className="text-gray-400">이미지 없음</p>
                  )}
                </div>
              </>
            )}

          </div>
        ))}
      </div>

      {/* FAB 버튼 & 리스트 팝업 */}
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
              {folders.map((folder) => (
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
        {selectedItem && (
          <ImageModal
            imageUrl={selectedItem}
            onClose={close}
            onNext={next}
            onPrev={prev}
          />
        )}
    </div>
  );
}

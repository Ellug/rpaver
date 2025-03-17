"use client";

import React, { useEffect, useState } from "react";
import LoadingModal from "./LoadingModal";
import { formatCharacterName } from "@/utils/NameFilter";
import { fetchFoldersFromStorage, fetchImagesFromStorage } from "@/utils/Storage";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

type ImageLoaderProps = {
  character: {
    name?: string;
    family?: string;
  };
  onClose: () => void;
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function ImageLoader({ character, onClose, setImages }: ImageLoaderProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(false);

  // 모달이 열릴 때 배경 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // 스토리지에서 폴더 목록 가져오기
  useEffect(() => {
    const fetchFolders = async () => {
      setLoading(true);
      const folderList = await fetchFoldersFromStorage("imgStock/");
      setFolders(folderList);
      setLoading(false);
    };

    fetchFolders();
  }, []);

  // 선택한 폴더의 이미지 목록 가져오기
  const handleFolderSelect = async (folder: string) => {
    setSelectedFolder(folder);
    setFetchingImages(true);
    const urls = await fetchImagesFromStorage(`imgStock/${folder}/`);
    setImageUrls(urls);
    setFetchingImages(false);
  };

  // 이미지 선택/해제 토글
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(imageUrl)
        ? prevSelected.filter((img) => img !== imageUrl) // 선택 해제
        : [...prevSelected, imageUrl] // 선택
    );
  };

  // 불러오기 버튼 클릭 시 이미지 이동 요청
  const handleMoveImages = async () => {
    if (selectedImages.length === 0) {
      alert("📌 복사할 이미지를 선택해주세요.");
      return;
    }
  
    if (!character.name) {
      alert("캐릭터 이름이 없으면 불러올 수 없습니다.");
      return;
    }
  
    setLoading(true);
    try {
      const formattedName = formatCharacterName(character.name, character.family);
  
      const oldPaths = selectedImages.map((url) => {
        const fileName = url.split("%2F").pop()?.split("?")[0];
        return {
          oldPath: `imgStock/${selectedFolder}/${fileName}`,
          newPath: `charactersIMG/${formattedName}/${fileName}`,
          fileName: fileName, // 파일명 저장
        };
      });
  
      const response = await fetch("/api/copyFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: oldPaths }),
      });
  
      const result = await response.json();
      if (result.success) {
        alert("✅ 이미지가 정상적으로 복사되었습니다.");
  
        // 업데이트된 스토리지 이미지로 갱신
        const newUrls = await Promise.all(
          oldPaths.map(async (file) => {
            const fileRef = ref(storage, file.newPath);
            return await getDownloadURL(fileRef);
          })
        );
  
        setImages((pre) => [...pre, ...newUrls]);
  
        onClose();
      } else {
        alert(`⚠️ 복사 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("🔥 이미지 복사 오류:", error);
      alert("❌ 이미지 복사 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
      {loading && <LoadingModal />}

      <div className="bg-gray-800 p-6 rounded-lg text-white shadow-lg w-full h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-4">폴더 선택 후 이미지를 불러오세요</h2>

        {/* 폴더 선택 Dropdown */}
        <div className="my-8 flex justify-center">
          <label className="block mr-2">📂 폴더 선택</label>
          <select
            value={selectedFolder}
            onChange={(e) => handleFolderSelect(e.target.value)}
            className="bg-gray-800 text-white px-3 rounded-md w-64"
          >
            <option value="">폴더를 선택하세요</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </div>

        {/* 이미지 목록을 스크롤 가능하도록 max-height & overflow 설정 */}
        <div className="flex-1 overflow-y-auto border border-gray-700 rounded-md p-2">
          {fetchingImages ? (
            <LoadingModal />
          ) : imageUrls.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {imageUrls.map((url, index) => (
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
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-center">📂 폴더를 선택하여 이미지를 불러오세요.</p>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className="flex justify-end gap-4 mt-6 mr-6">
          <button
            type="button"
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
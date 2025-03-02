"use client";

import React, { useState, useEffect } from "react";
import { storage } from "@/libs/firebaseConfig";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import ImageModal from "@/components/ImageModal";
import LoadingModal from "@/components/LoadingModal";
import { fetchGalleryFromStorage } from "@/utils/Storage";

export default function GalleryStock() {
  const [gallery, setGallery] = useState<{ folder: string; images: string[] }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolder, setNewFolder] = useState<string>("");

  // 저장소 폴더 가져오기
  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      const data = await fetchGalleryFromStorage("imgStock/");
      setGallery(data);
      setIsLoading(false);
    };

    fetchGallery();
  }, []);

  // 폴더별 토글 기능
  const handleToggle = (folder: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  // 이미지 업로드 핸들러
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !selectedFolder) {
      alert("📂 업로드할 폴더를 선택해주세요.");
      return;
    }
    const files = Array.from(event.target.files);

    setIsLoading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(storage, `imgStock/${selectedFolder}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const newUrls = await Promise.all(uploadPromises);
      setGallery((prevGallery) =>
        prevGallery.map((folderData) =>
          folderData.folder === selectedFolder
            ? { ...folderData, images: [...folderData.images, ...newUrls] }
            : folderData
        )
      );
      alert('업로드가 완료됐습니다')
      event.target.value = "";
    } catch (error) {
      alert('에러. 업로드가 실패했습니다.')
      console.error("🔥 이미지 업로드 실패:", error);
    }
    setIsLoading(false);
  };

  // 새 폴더 추가 핸들러
  const handleAddFolder = () => {
    if (!newFolder.trim()) return;
    if (gallery.some((folder) => folder.folder === newFolder)) {
      alert("⚠️ 이미 존재하는 폴더입니다.");
      return;
    }

    setGallery((prev) => [...prev, { folder: newFolder, images: [] }]);
    setSelectedFolder(newFolder);
    setNewFolder("");
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-7xl mx-auto">
      {isLoading && <LoadingModal />}

      <h1 className="text-2xl font-bold mb-4">갤러리 저장소</h1>
      <div className="flex justify-between items-center mb-6">

        {/* 폴더 선택 및 업로드 */}
        <div className="ml-auto flex flex-col md:flex-row gap-4 items-center space-x-4">

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="새 폴더 이름"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              className="bg-gray-800 text-white px-3 py-2 rounded-md"
            />
            <button onClick={handleAddFolder} className="bg-green-600 px-3 py-2 rounded-md hover:bg-green-500">
              + 추가
            </button>
          </div>

          {/* 폴더 선택 업로드 */}
          <div className="flex gap-2">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="bg-gray-800 text-white px-3 py-2 rounded-md"
            >
              <option value="">📂 폴더 선택</option>
              {gallery.map(({ folder }) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
            <label className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-500 transition">
              업로드
              <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 저장소 리스트 */}
      <div className="space-y-6">
        {gallery.map(({ folder, images }) => (
          <div key={folder} className="border border-gray-700 p-4 rounded-lg">
            {/* 폴더 클릭 시 이미지 리스트 토글 */}
            <h2
              className={`text-2xl font-semibold mb-2 cursor-pointer hover:text-yellow-400 ${
                expandedFolders[folder] ? "text-yellow-500" : "text-gray-300"
              }`}
              onClick={() => handleToggle(folder)}
            >
              📂 {folder} {expandedFolders[folder] ? "닫기" : "열기"}
            </h2>

            {expandedFolders[folder] && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.length > 0 ? (
                  images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`이미지 ${index}`}
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

      {/* 선택된 이미지가 있을 경우 모달 표시 */}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}
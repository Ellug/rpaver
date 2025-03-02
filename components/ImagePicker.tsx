import React, { useEffect, useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";
import LoadingModal from "@/components/LoadingModal";

export default function ImagePicker({ onSelect, onClose }: { onSelect: (imageUrl: string) => void; onClose: () => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    fetchStorageItems(currentPath);
  }, [currentPath]);

  // Storage 탐색 함수 (폴더 & 이미지 목록 불러오기)
  const fetchStorageItems = async (path: string) => {
    setLoading(true);
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);

      // 폴더 목록 가져오기
      setFolders(result.prefixes.map((folder) => folder.fullPath));

      // 이미지 목록 가져오기
      const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));
      setImages(urls);
    } catch (error) {
      console.error("🔥 Storage 데이터 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 선택한 이미지 적용
  const handleSelectImage = (imageUrl: string) => {
    const isConfirmed = window.confirm("이 이미지를 프로필로 설정하시겠습니까?");
    if (isConfirmed) onSelect(imageUrl);
  };

  // 폴더 탐색 (클릭 시 해당 폴더로 이동)
  const handleFolderClick = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  // 뒤로 가기 (상위 폴더로 이동)
  const handleGoBack = () => {
    if (!currentPath) return;
    const pathSegments = currentPath.split("/").slice(0, -1).join("/");
    setCurrentPath(pathSegments);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      {loading && <LoadingModal />}
      
      <div className="bg-gray-800 p-6 rounded-lg text-white shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold mb-4">이미지 선택</h2>

        {/* 현재 경로 표시 및 뒤로가기 */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-300">{currentPath || "Storage 루트"}</p>
          {currentPath && (
            <button onClick={handleGoBack} className="text-sm text-blue-400 hover:underline">
              ⬅ 뒤로가기
            </button>
          )}
        </div>

        {/* 스크롤 가능한 컨테이너 */}
        <div className="overflow-y-auto flex-1 space-y-4 p-2">
          {/* 폴더 리스트 */}
          {folders.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {folders.map((folder, index) => (
                <button
                  key={index}
                  className="p-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600"
                  onClick={() => handleFolderClick(folder)}
                >
                  📁 {folder.split("/").pop()}
                </button>
              ))}
            </div>
          )}

          {/* 이미지 리스트 */}
          {images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <img
                  key={index}
                  alt={`${index}pic`}
                  src={img}
                  className="object-contain rounded-md cursor-pointer hover:scale-105 transition"
                  onClick={() => handleSelectImage(img)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">이미지가 없습니다.</p>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button onClick={onClose} className="mt-4 w-full bg-gray-700 py-2 rounded-md hover:bg-gray-600 transition">
          닫기
        </button>
      </div>
    </div>
  );
}
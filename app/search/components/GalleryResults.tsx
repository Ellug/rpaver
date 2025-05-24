"use client";

import { useState, useEffect } from "react";
import LoadingModal from "@/components/LoadingModal";
import ImageModal from "@/components/ImageModal";
import { fetchGalleryFromStorage } from "@/utils/Storage";
import { useImageNavigator } from "@/utils/useImageNavigator";


interface GalleryResultsProps {
  queryText: string;
}

interface FileData {
  name: string;
  url: string;
}

interface FolderData {
  folderName: string;
  images: FileData[];
}

export default function GalleryResults({ queryText }: GalleryResultsProps) {
  const [galleryData, setGalleryData] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);

  const { selectedItem, open, close, next, prev } = useImageNavigator<FileData>(galleryData.map(f => f.images));

  useEffect(() => {
    if (!queryText) return;

    const fetchGallery = async () => {
      setLoading(true);
      try {
        const allFolders = await fetchGalleryFromStorage("/charactersIMG");

        // 검색어가 포함된 폴더만 필터링
        const matchingFolders = allFolders
          .filter((folder) => folder.folder.includes(queryText))
          .map((folder) => ({
            folderName: folder.folder,
            images: folder.images.map((url, index) => ({ name: `image_${index}`, url })),
          }));

        setGalleryData(matchingFolders);
      } catch (error) {
        console.error("🔥 갤러리 검색 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [queryText]);

  if (loading) return <LoadingModal />;
  if (galleryData.length === 0) return <p className="text-center text-gray-500">검색 결과가 없습니다.</p>;

  return (
    <div>
      {galleryData.map((folder, folderIndex) => (
        <div key={folder.folderName} className="border border-gray-300 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">📂 {folder.folderName}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {folder.images.map((img, index) => (
              <div
                key={img.name}
                className="relative cursor-pointer hover:scale-[1.05] transition"
                onClick={() => open(folderIndex, index)}
              >
                <img src={img.url} alt={img.name} className="w-full h-auto rounded-lg shadow-sm" />
                <p className="text-sm text-gray-600 mt-1 text-center">{img.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedItem && (
        <ImageModal
          imageUrl={selectedItem.url}
          onClose={close}
          onNext={next}
          onPrev={prev}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import LoadingModal from "@/components/LoadingModal";
import ImageModal from "@/components/ImageModal";
import { fetchGalleryFromStorage } from "@/utils/Storage";


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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      {galleryData.map((folder) => (
        <div key={folder.folderName} className="border border-gray-300 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">📂 {folder.folderName}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {folder.images.map((img) => (
              <div key={img.name} className="relative cursor-pointer hover:scale-[1.05] transition" onClick={() => setSelectedImage(img.url)}>
                <img src={img.url} alt={img.name} className="w-full h-auto rounded-lg shadow-sm" />
                <p className="text-sm text-gray-600 mt-1 text-center">{img.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}

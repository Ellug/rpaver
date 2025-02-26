"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import { db, storage } from "@/libs/firebaseConfig";
import LoadingModal from "@/components/LoadingModal";
// @ts-expect-error: TypeScript가 Slider 모듈을 인식하지 못함
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageModal from "@/components/ImageModal";

type Item = {
  id: string;
  category: string;
  name: string;
  detail: string;
  created: number;
};

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const itemData = docSnap.data();

          setItem({
            id: docSnap.id,
            category: itemData.category || "카테고리 없음",
            name: itemData.name || "이름 없음",
            detail: itemData.detail || "설명 없음",
            created: itemData.created instanceof Timestamp ? itemData.created.toMillis() : Date.now(), // ✅ Timestamp 변환
          });

          // 🔹 Storage에서 해당 아이템 폴더의 이미지 가져오기
          await fetchItemImages(itemData.name);
        } else {
          alert("해당 아이템을 찾을 수 없습니다.");
          router.push("/board/item");
        }
      } catch (error) {
        console.error("🔥 Firestore에서 데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, router]);

  // 🔹 Storage에서 해당 아이템 폴더 내 모든 이미지 가져오기
  const fetchItemImages = async (name: string) => {
    const folderRef = ref(storage, `items/${name}/`);

    try {
      const result = await listAll(folderRef);

      if (result.items.length === 0) {
        console.warn(`⚠️ 이미지 없음: items/${name}/`);
        return;
      }

      const urls = await Promise.all(
        result.items.map(async (item) => await getDownloadURL(item))
      );

      console.log(`✅ 불러온 이미지 (${name}):`, urls);
      setImageUrls(urls);
    } catch (error) {
      console.error(`🔥 Storage 이미지 가져오기 실패 (${name}):`, error);
    }
  };

  if (loading) return <LoadingModal />;
  if (!item) return <div className="text-center text-gray-400 mt-10">아이템을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-4xl mx-auto my-10 p-4 md:p-12 bg-gray-900 text-white rounded-lg shadow-lg relative">
      {/* 🔹 아이템 이미지 슬라이더 */}
      <div className="relative flex justify-center mb-6">
        <div className="w-full max-w-lg">
          {imageUrls.length > 0 ? (
            <Slider dots infinite speed={200} slidesToShow={1} slidesToScroll={1} arrows adaptiveHeight>
              {imageUrls.map((img, index) => (
                <div key={index} className="flex justify-center">
                  <img
                    src={img}
                    alt={`아이템 이미지 ${index + 1}`}
                    className="rounded-lg w-full h-80 object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedImage(img)}
                  />
                </div>
              ))}
            </Slider>
          ) : (
            <div className="w-full h-80 flex items-center justify-center bg-gray-800 rounded-lg text-gray-500">
              이미지 없음
            </div>
          )}
        </div>
      </div>

      {/* 🔹 아이템 정보 */}
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold text-gold">{item.name}</h1>
        <p className="text-gray-400">{item.category}</p>
      </div>

      {/* 🔹 상세 정보 */}
      <div className="mt-6 text-sm text-gray-300">
        <p>{item.detail}</p>
        <p>{new Date(item.created).toLocaleDateString("ko-KR")}</p>
      </div>

      {/* 🔹 버튼 그룹 */}
      <div className="flex justify-center gap-4 mt-12 mb-4">
        {/* 🔹 수정 버튼 */}
        <button
          onClick={() => router.push(`/board/item/edit/${id}`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
        >
          수정
        </button>

        {/* 🔹 목록으로 돌아가기 버튼 */}
        <button
          onClick={() => router.push("/board/item")}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition"
        >
          목록으로 돌아가기
        </button>
      </div>

      {/* 🔹 이미지 확대 모달 */}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL, listAll, uploadBytes, deleteObject } from "firebase/storage";
import { db, storage } from "@/libs/firebaseConfig";
import LoadingModal from "@/components/LoadingModal";
// @ts-expect-error: TypeScript가 Slider 모듈을 인식하지 못함
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

type Item = {
  id: string;
  category: string;
  name: string;
  detail: string;
  created: number;
};

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<File | null>(null);

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
            category: itemData.category || "",
            name: itemData.name || "",
            detail: itemData.detail || "",
            created: itemData.created?.toMillis() || Date.now(),
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

  // 🔹 입력 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (item) {
      setItem({ ...item, [e.target.name]: e.target.value });
    }
  };

  // 🔹 Firestore 업데이트 함수
  const handleUpdate = async () => {
    if (!item) return;

    try {
      const docRef = doc(db, "items", id);
      await updateDoc(docRef, {
        category: item.category,
        name: item.name,
        detail: item.detail,
      });

      alert("수정이 완료되었습니다.");
      router.push(`/board/item/detail/${id}`);
    } catch (error) {
      console.error("🔥 Firestore 업데이트 실패:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  // 🔹 이미지 삭제 함수
  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const fileRef = ref(storage, imageUrl.split(storage.app.options.storageBucket!)[1]);

      await deleteObject(fileRef);
      alert("이미지가 삭제되었습니다.");

      // UI 업데이트
      setImageUrls(imageUrls.filter((url) => url !== imageUrl));
    } catch (error) {
      console.error("🔥 이미지 삭제 실패:", error);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  };

  // 🔹 이미지 추가 함수
  const handleUploadImage = async () => {
    if (!newImage || !item) return;

    try {
      const imageRef = ref(storage, `items/${item.name}/${newImage.name}`);
      await uploadBytes(imageRef, newImage);
      const newImageUrl = await getDownloadURL(imageRef);

      setImageUrls([...imageUrls, newImageUrl]);
      setNewImage(null);

      alert("이미지가 업로드되었습니다.");
    } catch (error) {
      console.error("🔥 이미지 업로드 실패:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
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
                <div key={index} className="flex justify-center relative">
                  <img
                    src={img}
                    alt={`아이템 이미지 ${index + 1}`}
                    className="rounded-lg w-full h-80 object-contain cursor-pointer hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={() => handleDeleteImage(img)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-500 transition"
                  >
                    삭제
                  </button>
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

      {/* 🔹 아이템 수정 입력 폼 */}
      <div className="text-gray-300">
        <label className="block font-medium">카테고리</label>
        <input type="text" name="category" value={item.category} onChange={handleChange} className="w-full border px-3 py-2 rounded-md text-black" />

        <label className="block font-medium mt-4">이름</label>
        <input type="text" name="name" value={item.name} onChange={handleChange} className="w-full border px-3 py-2 rounded-md text-black" />

        <label className="block font-medium mt-4">설명</label>
        <textarea name="detail" value={item.detail} onChange={handleChange} className="w-full border px-3 py-2 rounded-md h-24 resize-none text-black"></textarea>
      </div>

      {/* 🔹 이미지 업로드 */}
      <div className="mt-6">
        <input type="file" onChange={(e) => setNewImage(e.target.files?.[0] || null)} className="text-gray-300" />
        <button onClick={handleUploadImage} className="ml-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-500 transition">
          추가
        </button>
      </div>

      {/* 🔹 저장 버튼 */}
      <button onClick={handleUpdate} className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition">
        저장
      </button>
    </div>
  );
}
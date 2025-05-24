"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/libs/firebaseConfig";
import LoadingModal from "@/components/LoadingModal";
import ImageModal from "@/components/ImageModal";
import { useUserContext } from "@/contexts/UserContext";
// @ts-expect-error: TypeScript가 Slider 모듈을 인식하지 못함
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FormatText from "@/utils/FormatText";
import { useImageNavigator } from "@/utils/useImageNavigator";

interface PageData {
  imageUrl: string;
  detail: string;
}

interface Item {
  id: string;
  category: string;
  name: string;
  pages: PageData[];
  created: number;
  updatedAt: number;
  author: string;
}

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { users } = useUserContext();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { selectedItem, open, close, next, prev } = useImageNavigator<string>([item?.pages.map(p => p.imageUrl) ?? []]);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const itemData = docSnap.data();

          setItem({
            id: docSnap.id,
            category: itemData.category || "카테고리 없음",
            name: itemData.name || "이름 없음",
            pages: itemData.pages || [],
            created: itemData.created?.toMillis() || Date.now(),
            updatedAt: itemData.created?.toMillis() || Date.now(),
            author: itemData.author || "unknown",
          });
        } else {
          alert("해당 사전을 찾을 수 없습니다.");
          router.back();
        }
      } catch (error) {
        console.error("🔥 Firestore에서 데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, router]);

  // 🔹 작성자 정보 찾기 (UserContext 사용)
  const authorData = users[item?.author ?? ""] || {
    name: "익명",
    picture: "/default-profile.png",
  };

  // 🔹 아이템 삭제 함수
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    if (!item) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "items", item.id));

      // 🔹 Storage 폴더 삭제
      for (const page of item.pages) {
        if (page.imageUrl) {
          const storageRef = ref(storage, page.imageUrl);
          await deleteObject(storageRef);
        }
      }

      alert("사전이 삭제되었습니다.");
      router.push("/board/item");
    } catch (error) {
      console.error("🔥 사전 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  if (loading) return <LoadingModal />;
  if (!item) return <div className="text-center text-gray-400 mt-10">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-6xl mx-auto my-10 p-4 md:p-12 bg-gray-900 text-white rounded-lg shadow-lg relative">
      
      {/* 사전 정보 */}
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold text-gold">{item.name}</h1>
        <p className="text-gray-400">{item.category}</p>
      </div>

      {/* 이미지 슬라이더 */}
      <div className="relative flex justify-center mb-6">
        <div className="w-[95%]">
          <Slider dots infinite speed={200} slidesToShow={1} slidesToScroll={1} arrows adaptiveHeight >
            {item.pages.map((page, index) => (
              <div key={index} className="flex flex-col items-center h-[100vh]">
                {/* 이미지 영역 */}
                {page.imageUrl ? (
                  <img
                    src={page.imageUrl}
                    alt={`페이지 ${index + 1}`}
                    tabIndex={-1}
                    className="rounded-lg w-[90%] mx-auto h-[250px] md:h-[400px] object-contain cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => open(0, index)}
                  />
                ) : (
                  <div className="w-full h-80 flex items-center justify-center bg-gray-800 rounded-lg text-gray-500">
                    이미지 없음
                  </div>
                )}

                {/* 페이지 설명 영역 (p 태그 줄바꿈 적용) */}
                <div className="w-[95%] md:w-[80%] my-8 md:my-12 mx-auto text-gray-300 overflow-y-auto">
                  <h3 className="text-xl mb-4 font-semibold text-gold">Page {index + 1}</h3>
                  <hr className="mb-4 opacity-30"/>
                  <FormatText text={page.detail} />
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      {/* 작성자 정보 */}
      <div className="flex justify-between my-8">
        <div>
          <p className="text-gray-400">마지막 수정일: {new Date(item.updatedAt).toLocaleDateString("ko-KR")}</p>
          <p className="mt-2 text-gray-400">등록일: {new Date(item.created).toLocaleDateString("ko-KR")}</p>
        </div>
        <div className="flex items-center gap-3">
          <img src={authorData.picture} alt={authorData.name} className="w-10 h-10 rounded-full border border-gray-500" />
          <p className="text-lg font-semibold">{authorData.name}</p>
        </div>
      </div>

      {/* 🔹 버튼 그룹 */}
      <div className="flex justify-center gap-4 mt-12 mb-4">
        <button onClick={() => router.push(`/board/item/edit/${id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition">
          수정
        </button>
        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition">
          삭제
        </button>
        <button onClick={() => router.push("/board/item")} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">
          목록으로
        </button>
      </div>

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

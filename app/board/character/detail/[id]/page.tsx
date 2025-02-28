"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "@/libs/firebaseConfig";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import LoadingModal from "@/components/LoadingModal";
// @ts-expect-error: TypeScript가 Slider 모듈을 인식하지 못함
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageModal from "@/components/ImageModal";

type CharacterDetail = {
  birth: string;
  body: string;
  country: string;
  detail: string;
  family: string;
  familyRelation: string;
  gender: string;
  hobby: string;
  name: string;
  party: string;
  personality: string;
  series: string;
  skill: string;
  talent: string;
  title: string;
  unit: string;
  voice: string;
  weapon: string;
};

export default function CharacterDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : id;
  const decodedId = characterId ? decodeURIComponent(characterId) : "";

  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!decodedId) return;

    const fetchCharacter = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "character_detail", decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const charData = docSnap.data() as CharacterDetail;
          setCharacter(charData);
          
          // 🔹 Storage에서 이미지 불러오기
          await fetchCharacterImages(charData.name, charData.family);
        } else {
          console.error("🔥 해당 캐릭터를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("🔥 Firestore에서 데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [decodedId]);

  // 🔹 Storage에서 해당 캐릭터 폴더 내 이미지 가져오기
  const fetchCharacterImages = async (name: string, family: string) => {
    const folderName = family ? `${name} ${family}` : name;
    const folderRef = ref(storage, `charactersIMG/${folderName}/`);
  
    try {
      const result = await listAll(folderRef);
  
      if (result.items.length === 0) {
        console.warn(`⚠️ 이미지 없음: charactersIMG/${folderName}/`);
        return;
      }
  
      const urls = await Promise.all(
        result.items.map(async (item) => await getDownloadURL(item))
      );
  
      console.log(`✅ 불러온 이미지 (${folderName}):`, urls);
      setImageUrls(urls);
    } catch (error) {
      console.error(`🔥 Storage 이미지 가져오기 실패 (${folderName}):`, error);
    }
  };
  

  if (loading) return <LoadingModal />;
  if (!character) return <div className="text-center text-gray-400 mt-10">캐릭터 정보를 찾을 수 없습니다.</div>;

  // 🔹 캐릭터 삭제 함수
  const handleDeleteCharacter = async () => {
    if (!decodedId) return;
    setLoading(true);

    try {
      // 🔹 Firestore에서 캐릭터 문서 삭제
      await deleteDoc(doc(db, "character", decodedId));
      await deleteDoc(doc(db, "character_detail", decodedId));

      alert("캐릭터가 삭제되었습니다.");
      router.push("/board/character"); // 캐릭터 목록으로 이동
    } catch (error) {
      console.error("🔥 캐릭터 삭제 중 오류 발생:", error);
      alert("캐릭터 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 수정 버튼 클릭 시 이동
  const handleEditClick = () => {
    router.push(`/board/character/edit/${encodeURIComponent(decodedId)}`);
  };

  return (
    <div className="max-w-4xl mx-auto my-10 p-4 md:p-12 bg-gray-900 text-white rounded-lg shadow-lg relative overflow-hidden">
      {/* 캐릭터 이미지 슬라이더 */}
      {imageUrls.length > 0 && (
        <div className="relative flex justify-center">
          <div className="w-full max-w-lg">
            <Slider dots infinite speed={100} slidesToShow={1} slidesToScroll={1} arrows adaptiveHeight>
              {imageUrls.map((img, index) => (
                <div key={index} className="flex justify-center">
                  <img
                    src={img}
                    alt={character.name}
                    className="rounded-lg w-full h-80 object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedImage(img)}
                  />
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}

      {/* 캐릭터 이름 및 소속 */}
      <div className="text-center mt-12">
        {character.title && <p className="text-lg text-gray-400">{character.title}</p>}
        <h1 className="text-3xl font-bold text-gold">{character.name} {character.family}</h1>
        <p className="text-gray-300">{character.party || "소속 없음"}</p>
      </div>

      {/* 기본 정보 */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        {[
          { label: "이름", value: character.name },
          { label: "성(가문)", value: character.family },
          { label: "출생", value: character.birth },
          { label: "성별", value: character.gender },
          { label: "칭호", value: character.title },
          { label: "성향", value: character.personality },
          { label: "출신", value: character.country },
          { label: "소속", value: character.party },
          { label: "신체", value: character.body },
          { label: "유닛", value: character.unit },
          { label: "무기", value: character.weapon },
          { label: "능력", value: character.skill },
          { label: "특기", value: character.talent },
          { label: "취미", value: character.hobby },
          { label: "성우", value: character.voice },
          { label: "시리즈", value: character.series },
          { label: "가족 관계", value: character.familyRelation },
        ].map((info, index) => (
          <div key={index}>
            <p className="font-bold text-gray-400">{info.label}: <span className="font-semibold text-white">{info.value || "-"}</span></p>
          </div>
        ))}
      </div>

      {/* 상세 설명 */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gold">상세 설명</h2>
        <p className="mt-2 text-gray-300 whitespace-pre-line">{character.detail || "설명 없음"}</p>
      </div>

      {/* 버튼 그룹 */}
      <div className="flex justify-center gap-4 mt-12 mb-4">
        <button onClick={handleEditClick} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition">
          수정
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition">
          삭제
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-800 p-6 rounded-lg text-white shadow-lg">
            <p className="mb-4">정말 이 캐릭터를 삭제하시겠습니까?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-600 rounded-md">취소</button>
              <button onClick={handleDeleteCharacter} className="px-4 py-2 bg-red-600 rounded-md">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}
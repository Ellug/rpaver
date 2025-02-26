"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/libs/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import LoadingModal from "@/components/LoadingModal";
// @ts-ignore
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageModal from "@/components/ImageModal";
import { useRouter } from "next/navigation";

type CharacterDetail = {
  birth: string;
  body: string;
  brother: string;
  child: string;
  country: string;
  detail: string;
  family: string;
  familyRelation: string;
  gender: string;
  hobby: string;
  images?: string[];
  marriage: string;
  name: string;
  parent: string;
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

  useEffect(() => {
    if (!decodedId) return;

    const fetchCharacter = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "character_details", decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCharacter(docSnap.data() as CharacterDetail);
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

  if (loading) return <LoadingModal />;
  if (!character) return <div className="text-center text-gray-400 mt-10">캐릭터 정보를 찾을 수 없습니다.</div>;

  // 기본 정보 배열
  const Info = [
    { label: "출생", value: character.birth },
    { label: "출신", value: character.country },
    { label: "성별", value: character.gender },
    { label: "성(가문)", value: character.family },
    { label: "칭호", value: character.title },
    { label: "성격", value: character.personality },
    { label: "신체", value: character.body },
    { label: "유닛", value: character.unit },
    { label: "무기", value: character.weapon },
    { label: "특기", value: character.talent },
    { label: "취미", value: character.hobby },
    { label: "능력", value: character.skill },
    { label: "성우", value: character.voice },
    { label: "시리즈", value: character.series },
    { label: "가족 관계", value: character.familyRelation },
  ];

  // 이미지 슬라이더 설정
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 100,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: true,
  };

  // 수정 버튼 클릭 시 이동
  const handleEditClick = () => {
    router.push(`/board/character/edit/${encodeURIComponent(decodedId)}`);
  };

  return (
    <div className="max-w-4xl mx-auto my-10 p-4 md:p-12 bg-gray-900 text-white rounded-lg shadow-lg relative">
      {/* 캐릭터 이미지 슬라이더 */}
      {character.images && character.images.length > 0 && (
        <div className="relative flex justify-center">
          <div className="w-full max-w-lg">
            <Slider {...sliderSettings}>
              {character.images.map((img, index) => (
                <div key={index} className="flex justify-center">
                  <img
                    src={img}
                    alt={character.name}
                    className="rounded-lg w-full h-80 object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedImage(img)} // 클릭 시 확대 모달 오픈
                  />
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}

      {/* 캐릭터 이름 및 소속 */}
      <div className="text-center mt-6">
        {character.title && <p className="text-lg text-gray-400">{character.title}</p>}
        <h1 className="text-3xl font-bold text-gold">{character.name} {character.family}</h1>
        <p className="text-gray-300">{character.party || "소속 없음"}</p>
      </div>

      {/* 기본 정보 */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        {Info.map((info, index) => (
          <div key={index}>
            <p className="font-bold text-gray-400">{info.label}: <span className="font-semibold text-white">{info.value || "-"}</span></p>
          </div>
        ))}
      </div>

      {/* 상세 설명을 최하단에 배치 */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gold">상세 설명</h2>
        <p className="mt-2 text-gray-300 whitespace-pre-line">{character.detail || "설명 없음"}</p>
      </div>

      {/* 수정 버튼 */}
      <div className="flex justify-center mt-12 mb-4">
        <button
          onClick={handleEditClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
        >
          수정
        </button>
      </div>

      {/* 이미지 확대 모달 */}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { db, storage } from "@/libs/firebaseConfig";
import { collection, addDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import LoadingModal from "@/components/LoadingModal";
import ImageLoader from "@/components/ImageLoader";
import { fetchImagesFromStorage } from "@/utils/Storage";

export default function CharacterUpdate({ character, isEdit = false }: { character?: CharacterDetail; isEdit?: boolean }) {
  const router = useRouter();
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : id;
  const [showImageLoader, setShowImageLoader] = useState(false);

  const [formData, setFormData] = useState<CharacterDetail>({
    name: character?.name || "",
    family: character?.family || "",
    birth: character?.birth || "",
    detail: character?.detail || "",
    country: character?.country || "",
    gender: character?.gender || "",
    title: character?.title || "",
    personality: character?.personality || "",
    body: character?.body || "",
    unit: character?.unit || "",
    weapon: character?.weapon || "",
    talent: character?.talent || "",
    hobby: character?.hobby || "",
    skill: character?.skill || "",
    voice: character?.voice || "",
    series: character?.series || "",
    familyRelation: character?.familyRelation || "",
    party: character?.party || "",
  });

  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isHelpVisible, setIsHelpVisible] = useState(false)

  // 🔹 기존 캐릭터 이미지 불러오기 (Storage)
  useEffect(() => {
    if (!characterId) return;
    const fetchCharacterImages = async () => {
      setLoading(true);
      const folderName = formData.family ? `${formData.name} ${formData.family}` : formData.name;
      const folderPath = `charactersIMG/${folderName}/`;
      
      const urls = await fetchImagesFromStorage(folderPath);
      setImageUrls(urls);
      setLoading(false);
    };
  
    fetchCharacterImages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);
  

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 캐릭터 저장 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const basicCharacterData = {
        birth: formData.birth,
        name: formData.name,
        family: formData.family,
        title: formData.title,
        gender: formData.gender,
        unit: formData.unit,
        party: formData.party,
        skill: formData.skill,
        body: formData.body,
      };

      if (isEdit === true && characterId) {
        await updateDoc(doc(db, "character", characterId), basicCharacterData);
        await updateDoc(doc(db, "character_detail", characterId), { ...formData });
      } else {
        const characterRef = await addDoc(collection(db, "character"), basicCharacterData);
        const newCharacterId = characterRef.id;
        await setDoc(doc(db, "character_detail", newCharacterId), { ...formData });
      }

      router.back();
    } catch (error) {
      console.error("🔥 저장 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setLoading(true);

    try {
      const folderName = formData.family ? `${formData.name} ${formData.family}` : formData.name;
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(storage, `charactersIMG/${folderName}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const newUrls = await Promise.all(uploadPromises);
      setImageUrls((prev) => [...prev, ...newUrls]);

      // 파일 선택 초기화
      e.target.value = "";
    } catch (error) {
      console.error("🔥 이미지 업로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 이미지 삭제 핸들러
  const handleDeleteImage = async (imageUrl: string) => {
    if (!window.confirm("정말로 이 이미지를 삭제하시겠습니까?")) return;
    setLoading(true);

    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      setImageUrls((prev) => prev.filter((url) => url !== imageUrl));
    } catch (error) {
      console.error("🔥 이미지 삭제 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-4 p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      {loading && <LoadingModal />}

      <form onSubmit={handleSubmit} autoComplete="new-password" className="flex flex-col gap-4">
        {/* 이미지 목록 미리보기 */}
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((img, index) => (
            <div key={index} className="relative w-36 h-36">
              <img src={img} alt="업로드된 이미지" className="w-full h-full object-cover rounded-md" />
              <button
                type="button"
                onClick={() => handleDeleteImage(img)}
                className="absolute top-0 right-0 bg-red-600 text-white px-1 py-0.5 text-xs rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 파일 업로드 */}
        {isEdit === true &&
          <div className="flex gap-4 mt-4 justify-center">
            <label className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-500 transition">
              이미지 업로드
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => setShowImageLoader(true)}
              className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
            >
              갤러리에서 불러오기
            </button>
          </div>
        }

        {/* 입력 필드 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "이름", name: "name" },
            { label: "성(가문)", name: "family" },
            { label: "출생 연도", name: "birth" },
            { label: "출신", name: "country" },
            { label: "성별", name: "gender" },
            { label: "칭호", name: "title" },
            { label: "성향", name: "personality" },
            { label: "소속", name: "party" },
            { label: "신체", name: "body" },
            { label: "유닛", name: "unit" },
            { label: "무기", name: "weapon" },
            { label: "능력", name: "skill" },
            { label: "특기", name: "talent" },
            { label: "취미", name: "hobby" },
            { label: "성우", name: "voice" },
            { label: "시리즈", name: "series" },
            { label: "가족 관계", name: "familyRelation" },
          ].map((field) => (
            <div key={field.name} className="flex items-center gap-4">
              <label htmlFor={field.name} className="w-20 text-gray-300 font-medium">
                {field.label}
              </label>
              <input
                id={field.name}
                type="text"
                name={field.name}
                value={formData[field.name as keyof CharacterDetail]}
                onChange={handleChange}
                className="flex-1 p-2 bg-gray-700 rounded-md"
              />
            </div>
          ))}
        </div>

        {/* 텍스트 포맷 도움말 필드 */}
        <button
          type="button"
          onClick={() => setIsHelpVisible(!isHelpVisible)}
          className="mt-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
        >
          {isHelpVisible ? "📌 도움말 닫기" : "📌 텍스트 포맷 도움말"}
        </button>

        {/* 텍스트 포맷 도움말 필드 (토글 가능) */}
        {isHelpVisible && (
          <div className="bg-gray-800 p-4 rounded-lg text-white text-sm mt-2">
            <ul className="list-inside space-y-2">
              <li><code>**타이틀 텍스트**</code> → <span className="text-white font-bold text-2xl">타이틀 텍스트</span></li>
              <li><code>*골드 텍스트*</code> → <span className="text-gold">골드 텍스트</span></li>
              <li><code>!!빨간색 강조!!</code> → <span className="text-red-500">빨간색 강조</span></li>
              <li><code>##초록색 강조##</code> → <span className="text-green-500 font-bold">초록색 강조</span></li>
              <li><code>@@{`{캐릭터 이름}`}</code>@@ → <span className="text-blue-400 hover:underline font-bold">캐릭터 링크</span></li>
              <li><code>---</code> → 구분선</li>
            </ul>
          </div>
        )}

        <textarea name="detail" placeholder="캐릭터 상세 설명" value={formData.detail} onChange={handleChange} onTouchStart={(e) => e.stopPropagation()} className="p-2 bg-gray-700 rounded-md h-80" />

        <button type="submit" className="p-2 bg-blue-600 rounded-md hover:bg-blue-500">
          {isEdit ? "수정하기" : "등록하기"}
        </button>

        {/* ImageLoader 컴포넌트 렌더링 */}
        {showImageLoader && <ImageLoader character={formData} onClose={() => setShowImageLoader(false)} setImages={setImageUrls} />}
      </form>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { db, storage } from "@/libs/firebaseConfig";
import { collection, addDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import LoadingModal from "@/components/LoadingModal";

type Character = {
  id?: string;
  name: string;
  family: string;
  birth: string;
  detail: string;
  country: string;
  gender: string;
  title: string;
  personality: string;
  body: string;
  unit: string;
  weapon: string;
  talent: string;
  hobby: string;
  skill: string;
  voice: string;
  series: string;
  familyRelation: string;
  party: string;
  images?: string[];
};

type CharacterFormProps = {
  character?: Character;
  isEdit?: boolean;
};

export default function CharacterUpdate({ character, isEdit = false }: CharacterFormProps) {
  const router = useRouter();
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (isEdit && characterId) {
      setFormData((prev) => ({ ...prev, id: characterId })); 
    }
  }, [characterId, isEdit]);


  const [formData, setFormData] = useState<Character>({
    id: character?.id || "",
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
    images: character?.images || [],
  });

  const [loading, setLoading] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 이미지 추가 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages([...newImages, ...Array.from(e.target.files)]);
    }
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = (imageUrl: string) => {
    setRemovedImages([...removedImages, imageUrl]);
    setFormData({
      ...formData,
      images: formData.images?.filter((img) => img !== imageUrl) || [],
    });
  };

  // 저장 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedImages = [...(formData.images || [])];

      // 1️⃣ **삭제된 이미지 Firebase Storage에서 제거**
      for (const imageUrl of removedImages) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      // 2️⃣ **새로운 이미지 Firebase Storage에 업로드**
      for (const image of newImages) {
        const imageRef = ref(storage, `charactersIMG/${formData.id || Date.now()}/${image.name}`);
        await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(imageRef);
        updatedImages.push(imageUrl);
      }

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

      if (isEdit && formData.id) {
        // 🔹 **기존 문서 업데이트**
        await updateDoc(doc(db, "character", formData.id), basicCharacterData);
        await updateDoc(doc(db, "character_detail", formData.id), { ...formData, images: updatedImages });
      } else {
        // 🔹 **새로운 문서 생성**
        const characterRef = await addDoc(collection(db, "character"), basicCharacterData);
        const newCharacterId = characterRef.id;

        await setDoc(doc(db, "character_detail", newCharacterId), {
          ...formData,
          images: updatedImages,
        });
      }

      router.push("/board/character"); // 캐릭터 목록으로 이동
    } catch (error) {
      console.error("🔥 저장 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      {loading && <LoadingModal />}

      <form onSubmit={handleSubmit} autoComplete="new-password" className="flex flex-col gap-4">
        {/* 🔹 이미지 목록 미리보기 */}
        <div className="flex flex-wrap gap-2">
          {formData.images?.map((img, index) => (
            <div key={index} className="relative w-24 h-24">
              <img src={img} alt="업로드된 이미지" className="w-full h-full object-cover rounded-md" />
              <button
                type="button"
                onClick={() => handleRemoveImage(img)}
                className="absolute top-0 right-0 bg-red-600 text-white px-1 py-0.5 text-xs rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 🔹 파일 업로드 */}
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} />

        {/* 🔹 입력 필드 (배열로 관리) */}
        {[
          { label: "이름", name: "name" },
          { label: "성(가문)", name: "family" },
          { label: "출생 연도", name: "birth" },
          { label: "출신", name: "country" },
          { label: "성별", name: "gender" },
          { label: "칭호", name: "title" },
          { label: "성격", name: "personality" },
          { label: "신체", name: "body" },
          { label: "유닛", name: "unit" },
          { label: "무기", name: "weapon" },
          { label: "특기", name: "talent" },
          { label: "취미", name: "hobby" },
          { label: "능력", name: "skill" },
          { label: "성우", name: "voice" },
          { label: "시리즈", name: "series" },
          { label: "가족 관계", name: "familyRelation" },
          { label: "소속", name: "party" },
        ].map((field) => (
          <input
            key={field.name}
            type="text"
            name={field.name}
            placeholder={field.label}
            value={formData[field.name as keyof Character]}
            onChange={handleChange}
            className="p-2 bg-gray-700 rounded-md"
            autoComplete="new-password"
          />
        ))}

        {/* 🔹 상세 설명 (텍스트 에어리어) */}
        <textarea
          name="detail"
          placeholder="캐릭터 상세 설명"
          value={formData.detail}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded-md h-80"
        />

        {/* 🔹 버튼 그룹 (수정 & 취소) */}
        <div className="flex gap-4">
          <button type="submit" className="p-2 bg-blue-600 rounded-md hover:bg-blue-500 flex-1">
            {isEdit ? "수정하기" : "등록하기"}
          </button>
          <button
            type="button"
            className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 flex-1"
            onClick={() => router.back()}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
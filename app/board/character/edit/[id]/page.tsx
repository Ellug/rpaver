"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/libs/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import CharacterUpdate from "@/components/CharacterUpdate";
import LoadingModal from "@/components/LoadingModal";

export default function EditCharacterPage() {
  const { id } = useParams();
  const characterId = typeof id === "string" ? decodeURIComponent(id) : "";

  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId) return;

    const fetchCharacter = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "character_detail", characterId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCharacter({ id: characterId, ...(docSnap.data() as CharacterDetail) });
        } else {
          console.error("🔥 Firestore에서 데이터를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("🔥 Firestore에서 데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [characterId]);

  if (loading) return <LoadingModal />;
  if (!character) return <div className="text-center text-gray-400 mt-10">캐릭터 정보를 찾을 수 없습니다.</div>;

  return <CharacterUpdate character={character} isEdit={true} />;
}
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/libs/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

type CharacterContextType = {
  characters: Character[];
  characterNames: string[];
};

// Context 생성
const CharacterContext = createContext<CharacterContextType | null>(null);

// Provider 컴포넌트
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterNames, setCharacterNames] = useState<string[]>([]);

  useEffect(() => {
    // Firestore 실시간 업데이트 감지
    const unsubscribe = onSnapshot(collection(db, "character"), (snapshot) => {
      const characterList: Character[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Character;
        return { ...data, id: doc.id };
      });

      const nameList = characterList.map((char) =>
        char.family ? `${char.name} ${char.family}` : char.name
      );

      console.log("✅ 불러온 캐릭터 데이터:", characterList);
      console.log("✅ 불러온 캐릭터 이름 리스트:", nameList);

      setCharacters(characterList);
      setCharacterNames(nameList);
    });

    return () => unsubscribe(); // Firestore 리스너 정리
  }, []);

  return (
    <CharacterContext.Provider value={{ characters, characterNames }}>
      {children}
    </CharacterContext.Provider>
  );
}

// Context를 가져오는 커스텀 훅
export function useCharacterContext() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacterContext must be used within a CharacterProvider");
  }
  return context;
}
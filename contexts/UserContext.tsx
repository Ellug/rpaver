"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";

// 유저 데이터 타입 정의
interface User {
  uid: string;
  name: string;
  picture?: string;
}

interface UserContextType {
  users: Record<string, User>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<Record<string, User>>({}); // 🔹 객체 형태로 초기화

  useEffect(() => {
    const usersCollection = collection(db, "users");

    // Firestore 실시간 구독 (onSnapshot 사용)
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const userList: Record<string, User> = {};
      snapshot.forEach((doc) => {
        userList[doc.id] = { ...(doc.data() as User) };
      });

      setUsers(userList);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  return <UserContext.Provider value={{ users }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within a UserProvider");
  return context;
};

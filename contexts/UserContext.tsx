"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";

// 🔹 유저 데이터 타입 정의
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
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList: Record<string, User> = {};

        querySnapshot.forEach((doc) => {
          userList[doc.id] = {
            ...(doc.data() as User),
          };
        });

        setUsers(userList);
      } catch (error) {
        console.error("🔥 사용자 목록 불러오기 실패:", error);
      }
    };

    fetchUsers();
  }, []);

  return <UserContext.Provider value={{ users }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within a UserProvider");
  return context;
};
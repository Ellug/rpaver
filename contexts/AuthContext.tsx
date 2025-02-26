"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "@/libs/firebaseConfig";
import {
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

interface UserData {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  created: any;
}

interface AuthContextType {
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 🔹 브라우저 세션에서 데이터 불러오기 (새로고침 시 유지)
    const storedUserData = sessionStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);
  
  useEffect(() => {
    if (userData) {
      // 🔹 userData가 변경될 때마다 sessionStorage에 저장
      sessionStorage.setItem("userData", JSON.stringify(userData));
    } else {
      // 🔹 로그아웃하면 sessionStorage에서 삭제
      sessionStorage.removeItem("userData");
    }
  }, [userData]);
  

  // 🔹 Firestore에서 사용자 데이터 가져오기 (없으면 생성)
  const fetchUserData = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // 🔹 기존 유저 데이터 불러오기
        setUserData(userSnap.data() as UserData);
      } else {
        // 🔹 새 유저 데이터 생성
        const newUserData: UserData = {
          uid: user.uid,
          email: user.email || "",
          name: user.email?.split("@")[0] || "New User", // 기본 이름: 이메일 앞부분
          picture: "",
          created: serverTimestamp(), // Firebase Timestamp (한국 시간 기준)
        };

        await setDoc(userRef, newUserData);
        setUserData(newUserData);
      }
    } catch (error) {
      console.error("🔥 Firestore에서 사용자 데이터 가져오기 실패:", error);
    }
  };

  // 🔹 로그인 함수 (Firestore 유저 데이터 확인 후 없으면 생성)
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      await fetchUserData(loggedInUser);
      router.replace("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error("🔥 로그인 실패:", error.message);
      } else {
        console.error("🔥 알 수 없는 오류 발생:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 로그아웃 함수
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      router.replace("/login");
    } catch (error) {
      console.error("🔥 로그아웃 실패:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ userData, login, logout, loading, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
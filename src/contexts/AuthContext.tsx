"use client";

import { createContext, useState, useEffect, useContext } from "react";
import { auth } from "@/libs/firebaseConfig";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  console.log(user)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error("로그인 실패:", error.message);
      } else {
        console.error("알 수 없는 오류 발생:", error);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error("로그아웃 실패:", error.message);
      } else {
        console.error("알 수 없는 오류 발생:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
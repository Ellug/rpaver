"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { userData, login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (userData) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData])

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력하세요.");
      return;
    }
    try {
      await login(email, password);
    } catch (error) {
      if (error instanceof FirebaseError) {
        alert("로그인 실패")
        console.error("로그인 실패:", error.message);
      } else {
        alert("로그인 실패")
        console.error("알 수 없는 오류 발생:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <main className="flex flex-col items-center gap-8 p-10 rounded-lg border border-white/30 shadow-lg shadow-white/10 w-full max-w-md">
        <p className="text-4xl text-white/80 text-center">RPAVER</p>
        <h1 className="text-2xl font-bold text-white">로그인</h1>
        <p className="text-sm text-white/80 text-center">
          로그인 정보를 입력하고 인증을 진행하세요.
        </p>

        <div className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 rounded-md bg-black/20 border border-white/50 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 rounded-md bg-black/20 border border-white/50 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            className="w-full py-3 mt-6 bg-white border border-white/50 text-black font-semibold rounded-md hover:bg-[#FFD700] hover:text-black transition"
            onClick={handleLogin}
          >
            로그인
          </button>
        </div>
      </main>

      <footer className="mt-10 text-sm text-white/60">
        &copy; {new Date().getFullYear()} RPaver. All rights reserved.
      </footer>
    </div>
  );
}
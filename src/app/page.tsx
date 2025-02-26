"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 sm:p-20">
      <main className="flex flex-col items-center gap-8 p-10 rounded-lg border border-white/30 shadow-lg shadow-white/10 w-full max-w-md">
        <p className="text-4xl text-white/80 text-center">RPAVER</p>
        <h1 className="text-2xl font-bold text-white">Welcome Spawner</h1>
      </main>

      <footer className="mt-10 text-sm text-white/60">
        &copy; {new Date().getFullYear()} RPaver. All rights reserved.
      </footer>
    </div>
  );
}

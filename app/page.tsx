"use client";

import LatestUpdates from "@/components/LatestUpdates";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { userData, loading } = useAuth();

  const updateConfigs = [
    {
      title: "최신 업데이트 된 캐릭터",
      collectionName: "character_detail",
      fields: ["name", "family", "series"],
      sendFields: ["id"],
      navigateTo: "/board/character/detail/",
      mode: "url",
    },
    {
      title: "최신 업데이트 된 히스토리",
      collectionName: "history",
      fields: ["title", "date"],
      sendFields: ["id", "date"],
      navigateTo: "/board/history",
      mode: "sessionStorage",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-black text-white">
      <main className="flex flex-col items-center gap-4 p-8 rounded-lg border border-white/30 shadow-lg shadow-white/10 w-full max-w-md">
        <p className="text-4xl text-white/80 text-center">RPAVER</p>
        <h1 className="text-2xl font-bold text-white">Welcome Spawner {userData?.name}</h1>
      </main>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
        {updateConfigs.map((config, index) => (
          <LatestUpdates key={index} {...config} />
        ))}
      </div>

      <footer className="mt-10 text-sm text-white/60">
        &copy; {new Date().getFullYear()} RPaver. All rights reserved.
      </footer>
    </div>
  );
}

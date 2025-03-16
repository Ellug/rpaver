"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingModal from "@/components/LoadingModal";

export default function AIGeneratorPage() {
  const { userData } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxChars = 500;

  useEffect(() => {
    const reusedPrompt = sessionStorage.getItem("reusePrompt");
    if (reusedPrompt) {
      setPrompt(reusedPrompt);
      sessionStorage.removeItem("reusePrompt");
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("프롬프트를 입력하세요!");
      return;
    }

    if (!userData) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/vertextaigen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          uid: userData.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("이미지 생성 실패");
      }

      const result = await response.json();
      setGeneratedImage(result.imageUrl);
    } catch (error) {
      console.error("이미지 생성 실패:", error);
      alert("이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 한글 제거 함수
  const removeKorean = (text: string) => {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g;
    if (koreanRegex.test(text)) {
      alert("한글은 지원되지 않습니다. 영어로 입력해 주세요!");
      return text.replace(koreanRegex, "");
    }
    return text;
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center p-6">
      {loading && <LoadingModal />}

      <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Vertext AI Generator
      </h1>

      <div className="w-full max-w-xl flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <textarea
            value={prompt}
            onChange={(e) => {
              const input = e.target.value;
              // 한글 제거
              const cleaned = removeKorean(input);

              // 500자 제한
              if (cleaned.length > maxChars) {
                setPrompt(cleaned.slice(0, maxChars));
              } else {
                setPrompt(cleaned);
              }
            }}
            placeholder="Prompt in English..."
            className="w-full p-3 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
          />

          <div className="text-right text-sm text-gray-400">
            {prompt.length} / {maxChars} characters
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-md hover:opacity-90 transition"
        >
          {loading ? "Generating..." : "이미지 생성하기"}
        </button>
      </div>

      {generatedImage && (
        <div className="mt-10">
          <img
            src={generatedImage}
            alt="Generated AI"
            className="object-contain border border-gray-700 rounded-md"
          />
        </div>
      )}
    </div>
  );
}

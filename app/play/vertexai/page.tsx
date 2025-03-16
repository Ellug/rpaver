"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingModal from "@/components/LoadingModal";
import { generateAndSaveImage } from "@/utils/VertexGen";
import { ImagenAspectRatio } from "firebase/vertexai";

export default function AIGeneratorPage() {
  const { userData } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(ImagenAspectRatio.SQUARE);
  const [loading, setLoading] = useState(false);
  const generatedImageRef = useRef<HTMLImageElement>(null);


  const maxChars = 500;

  const aspectRatios = [
    { label: "1:1", value: ImagenAspectRatio.SQUARE },
    { label: "4:3", value: ImagenAspectRatio.PORTRAIT_4x3 },
    { label: "3:4", value: ImagenAspectRatio.LANDSCAPE_3x4 },
    { label: "16:9", value: ImagenAspectRatio.LANDSCAPE_16x9 },
    { label: "9:16", value: ImagenAspectRatio.PORTRAIT_9x16 },
  ];  

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
      const result = await generateAndSaveImage(prompt, userData.uid, aspectRatio);
      setGeneratedImage(result.imageUrl);
    } catch (error: unknown) {
      console.error("이미지 생성 실패:", error);
      if (error instanceof Error) {
        alert(`에러 발생: ${error.message}`);
      } else {
        alert("알 수 없는 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }    
  };

  // 🔥 한글 제거 함수
  const removeKorean = (text: string) => {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g;
    if (koreanRegex.test(text)) {
      return text.replace(koreanRegex, "");
    }
    return text;
  };

  useEffect(() => {
    if (generatedImage && generatedImageRef.current) {
      generatedImageRef.current.scrollIntoView({
        behavior: "smooth", // 부드럽게
        block: "center",    // 화면 중앙에 오도록
      });
    }
  }, [generatedImage]);
  

  return (
    <div className="bg-black min-h-screen flex flex-col items-center p-6">
      {loading && <LoadingModal />}

      <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Vertex AI Generator
      </h1>

      <div className="w-full max-w-xl flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap mb-4">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.label}
              onClick={() => setAspectRatio(ratio.value)}
              className={`px-3 py-1 rounded-md ${
                aspectRatio === ratio.value
                  ? "bg-purple-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

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
            placeholder="Only English..."
            className="w-full p-3 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
          />

          <div className="text-right text-sm text-gray-400">
            {prompt.length} / {maxChars}
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
            ref={generatedImageRef}
            src={generatedImage}
            alt="Generated AI"
            className="object-contain border border-gray-700 rounded-md"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect } from "react";

type ImageModalProps = {
  imageUrl: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function ImageModal({ imageUrl, onClose, onPrev, onNext }: ImageModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* 닫기 버튼 */}
        <button
          className="absolute top-3 right-3 text-white text-xl px-3 py-1 rounded-full hover:bg-red-600 transition"
          onClick={onClose}
        >
          ✕
        </button>

        {/* 이전 버튼 */}
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 px-4 py-2 text-white text-3xl hover:text-gray-300"
          onClick={onPrev}
        >
          ◀
        </button>

        {/* 이미지 */}
        <img
          src={imageUrl}
          alt="확대 이미지"
          className="max-w-full max-h-screen object-contain rounded-lg"
        />

        {/* 다음 버튼 */}
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 px-4 py-2 text-white text-3xl hover:text-gray-300"
          onClick={onNext}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
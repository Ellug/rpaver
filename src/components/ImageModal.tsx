"use client";

import Image from "next/image";
import React from "react";

type ImageModalProps = {
  imageUrl: string;
  onClose: () => void;
};

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
      onClick={onClose} // 배경 클릭 시 닫기
    >
      <div className="relative">
        <button
          className="absolute top-3 right-3 text-white text-xl px-3 py-1 rounded-full hover:bg-red-600 transition"
          onClick={onClose} // 닫기 버튼
        >
          ✕
        </button>
        <Image
          src={imageUrl}
          alt="확대 이미지"
          layout="intrinsic"
          className="max-w-full max-h-screen object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
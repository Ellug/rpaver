"use client";

import React from "react";
import { formatRules } from "@/utils/FormatText";

interface FormatGuideProps {
  show: boolean;
  onClose: () => void;
}

const FormatGuide: React.FC<FormatGuideProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="absolute top-8 right-0 min-w-[250px] max-w-[400px] p-4 border border-gray-500 rounded-md text-sm bg-gray-800 text-white shadow-lg z-50">
      <div className="flex justify-between items-start mb-2">
        <p className="text-lg font-bold mb-4">포맷 가이드</p>
        <button className="text-gray-400 hover:text-gray-200" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="space-y-3">
        {formatRules.map((rule, index) => {
          return (
            <div key={index} className="flex flex-col border-b border-gray-600 pb-2">
              <p className="text-gray-300">
                <span className={rule.className}>{rule.example}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormatGuide;

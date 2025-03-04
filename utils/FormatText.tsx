"use client";

import React from "react";
import Link from "next/link";
import { useCharacterContext } from "@/contexts/CharacterContext";

interface FormatTextProps {
  text: string;
}

const FormatText: React.FC<FormatTextProps> = ({ text }) => {
  const { characters } = useCharacterContext();

  return (
    <div className="whitespace-pre-wrap">
      {text.split("---").map((segment, index) => (
        <React.Fragment key={index}>
          {index > 0 && <hr className="border-gray-500 mt-12" />}
          <div>
            {segment.split(/(@@{.*?}@@|\*\*.*?\*\*|\*.*?\*|__.*?__|!!.*?!!|##.*?##|~~.*?~~|`.*?`)/g).map((part, i) => {
              // 🔥 캐릭터 링크 변환
              const characterMatch = part.match(/@@{(.+?)}@@/);
              if (characterMatch) {
                const characterName = characterMatch[1].trim();
                const foundCharacter = characters.find(
                  (char) =>
                    char.family
                      ? `${char.name} ${char.family}` === characterName
                      : char.name === characterName
                );

                if (foundCharacter) {
                  return (
                    <Link
                      key={i}
                      href={`/board/character/detail/${foundCharacter.id}`}
                      className="text-blue-400 hover:underline font-bold"
                    >
                      {characterName}
                    </Link>
                  );
                }
              }

              // 🔥 **굵은 텍스트 변환**
              if (/\*\*(.*?)\*\*/.test(part)) {
                return (
                  <span key={i} className="text-white text-2xl font-bold">
                    {part.replace(/\*\*/g, "")}
                  </span>
                );
              }

              // 🔥 *골드 텍스트 변환*
              if (/\*(.*?)\*/.test(part)) {
                return (
                  <span key={i} className="text-gold">
                    {part.replace(/\*/g, "")}
                  </span>
                );
              }

              // 🔥 !!빨간색 강조 텍스트!!
              if (/!!(.*?)!!/.test(part)) {
                return (
                  <span key={i} className="text-red-500">
                    {part.replace(/!!/g, "")}
                  </span>
                );
              }

              // 🔥 ##초록색 강조 텍스트##
              if (/##(.*?)##/.test(part)) {
                return (
                  <span key={i} className="text-green-500 font-bold">
                    {part.replace(/##/g, "")}
                  </span>
                );
              }

              // 🔥 기본 출력
              return <span key={i}>{part}</span>;
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FormatText;
"use client";

import React from "react";
import Link from "next/link";
import { useCharacterContext } from "@/contexts/CharacterContext";

interface FormatTextProps {
  text: string;
}

export const formatRules = [
  {
    regex: /@@{.*?}@@/,
    extract: (match: string) => match.match(/@@{(.+?)}@@/)?.[1]?.trim(),
    className: "text-blue-400 hover:underline font-bold",
    isLink: true,
    example: "@@{캐릭터명링크}@@",
  },
  {
    regex: /\*\*.*?\*\*/,
    extract: (match: string) => match.match(/\*\*(.*?)\*\*/)?.[1],
    className: "text-white text-2xl font-bold",
    example: "**타이틀**",
  },
  {
    regex: /\*.*?\*/,
    extract: (match: string) => match.match(/\*(.*?)\*/)?.[1],
    className: "text-gold",
    example: "*골드 텍스트*",
  },
  {
    regex: /!!.*?!!/,
    extract: (match: string) => match.match(/!!(.*?)!!/)?.[1],
    className: "text-red-500",
    example: "!!레드 텍스트!!",
  },
  {
    regex: /##.*?##/,
    extract: (match: string) => match.match(/##(.*?)##/)?.[1],
    className: "text-green-500 font-bold",
    example: "##그린 텍스트##",
  },
];

// 🔥 화살표 변환 규칙 추가
const symbolRules: { regex: RegExp; replacement: string }[] = [
  { regex: /<->/g, replacement: "↔" },
  { regex: /<-|←/g, replacement: "←" },
  { regex: /->|→/g, replacement: "→" },
  { regex: /<=>/g, replacement: "⇔" },
  { regex: /<=/g, replacement: "≤" },
  { regex: />=/g, replacement: "≥" },
];

const FormatText: React.FC<FormatTextProps> = ({ text }) => {
  const { characters } = useCharacterContext();

  // 🔥 split 정규식 자동 생성
  const splitRegex = new RegExp(`(${formatRules.map(rule => rule.regex.source).join("|")})`, "g");

  return (
    <div className="whitespace-pre-wrap">
      {text.split("---").map((segment, index) => {
        // 🔥 화살표 변환 적용
        let processedText = segment;
        symbolRules.forEach(({ regex, replacement }) => {
          processedText = processedText.replace(regex, replacement);
        });

        return (
          <React.Fragment key={index}>
            {index > 0 && <hr className="border-gray-500 mt-12" />}
            <div>
              {processedText.split(splitRegex).map((part, i) => {
                if (!part) return null; // 빈 문자열 제거

                const rule = formatRules.find(({ regex }) => regex.test(part));
                if (!rule) return <span key={i}>{part}</span>;

                const content = rule.extract(part) || part;

                // 캐릭터 링크 처리 (ID 찾기)
                if (rule.isLink) {
                  const foundCharacter = characters.find((char) =>
                    char.family ? `${char.name} ${char.family}` === content : char.name === content
                  );

                  return foundCharacter ? (
                    <Link key={i} href={`/board/character/detail/${foundCharacter.id}`} className={rule.className}>
                      {content}
                    </Link>
                  ) : (
                    <span key={i} className={rule.className}>{content}</span>
                  );
                }

                // 일반 텍스트 처리 (span)
                return <span key={i} className={rule.className}>{content}</span>;
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FormatText;
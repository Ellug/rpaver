"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, ReactNode } from "react";
import Search from "./Search";

type SubMenuItem = 
  | { component: ReactNode }
  | { label: string; route: string };

type Menu = {
  name: string;
  subMenu: SubMenuItem[];
};

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const menues: Menu[] = [
    { 
      name: "게시판", 
      subMenu: [
        { label: "자유", route: "/board/free" },
        { label: "캐릭터", route: "/board/character" },
        { label: "히스토리", route: "/board/history" },
        { label: "설정", route: "/board/worldset" }
      ] 
    },
    { 
      name: "갤러리", 
      subMenu: [
        { label: "캐릭터", route: "/gallery/character" },
        { label: "폴더", route: "/gallery/folder" }
      ] 
    },
    { 
      name: "검색", 
      subMenu: [{ component: <Search setHoveredCategory={setHoveredCategory} /> }]
    },
  ];

  return pathname === "/login" ? null : (
    <nav className="w-full bg-black text-white border-b border-white/20 relative">
      <div className="flex px-6 py-3 items-center justify-between">
        {/* 좌측: 로고 */}
        <div
          className="text-xl md:text-2xl font-bold cursor-pointer hover:text-gray-300 transition"
          onClick={() => router.push("/")}
        >
          RPAVER
        </div>

        {/* 가운데: 메뉴 (가로 정렬 및 세로 정렬) */}
        <div className="flex gap-4 md:gap-6 text-sm md:text-lg font-medium items-center justify-center flex-grow">
          {menues.map((menu) => (
            <div
              key={menu.name}
              className={`relative cursor-pointer transition ${
                hoveredCategory === menu.name ? "text-gold font-bold" : "hover:text-gold hover:font-bold"
              }`}
              onMouseEnter={() => setHoveredCategory(menu.name)}
            >
              {menu.name}
            </div>
          ))}
        </div>

        {/* 우측: 유저 정보 */}
        <div className="text-sm text-gray-300">
          {user?.email || "로그인 필요"}
        </div>
      </div>

      {/* 아래 확장 컨테이너 */}
      <div
        className={`absolute left-0 w-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-in-out ${
          hoveredCategory ? "h-[56px] flex items-center justify-center" : "h-[2px]"
        }`}
        onMouseEnter={() => setHoveredCategory(hoveredCategory)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <div className={`flex justify-center items-center gap-6 text-md text-white font-bold 
          transition-all duration-300 ease-in-out opacity-0 ${
            hoveredCategory ? "opacity-100 delay-150" : ""
          }`}
        >
          {hoveredCategory && 
            menues.find((menu) => menu.name === hoveredCategory)?.subMenu.map((sub, index) => (
              "component" in sub ? (
                <div key={index}>{sub.component}</div>
              ) : (
                <div 
                  key={sub.label}
                  className="cursor-pointer hover:text-gold"
                  onClick={() => router.push(sub.route)}
                >
                  {sub.label}
                </div>
              )
            ))
          }
        </div>
      </div>
    </nav>
  );
}

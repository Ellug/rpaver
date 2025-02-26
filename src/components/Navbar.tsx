"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, ReactNode } from "react";

type SubMenuItem = 
  | { component: ReactNode }
  | { label: string; route: string };

type Menu = {
  name: string;
  subMenu: SubMenuItem[];
};

const menues: Menu[] = [
  { 
    name: "검색", 
    subMenu: [{ component: <input type="text" placeholder="검색..." className="px-2 py-1 rounded text-black" /> }]
  },
  { 
    name: "게시판", 
    subMenu: [
      { label: "캐릭터", route: "/board/character" },
      { label: "히스토리", route: "/board/history" },
      { label: "설정", route: "/board/settings" }
    ] 
  },
  { 
    name: "갤러리", 
    subMenu: [
      { label: "캐릭터", route: "/gallery/character" },
      { label: "배경", route: "/gallery/background" }
    ] 
  },
];

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return pathname === "/login" ? null : (
    <nav className="w-full bg-black text-white border-b border-white/20 relative">
      <div className="flex px-6 py-4 flex-col md:flex-row items-center justify-between">
        {/* 좌측: 로고 */}
        <div
          className="text-2xl font-bold cursor-pointer hover:text-gray-300 transition"
          onClick={() => router.push("/")}
        >
          RPAVER
        </div>

        {/* 가운데: 메뉴 */}
        <div className="flex gap-6 text-sm font-medium">
          {menues.map((menu) => (
            <div
              key={menu.name}
              className="relative cursor-pointer hover:text-gray-300 transition"
              onMouseEnter={() => setHoveredCategory(menu.name)}
            >
              {menu.name}
            </div>
          ))}
        </div>

        {/* 우측: 유저 정보 */}
        <div className="text-sm text-gray-300 md:order-3">
          {user?.email || "로그인 필요"}
        </div>
      </div>

      {/* 아래 확장 컨테이너 */}
      <div
        className={`absolute left-0 w-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-in-out overflow-hidden ${
          hoveredCategory ? "h-[56px]" : "h-[2px]"
        }`}
        onMouseEnter={() => setHoveredCategory(hoveredCategory)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <div className="flex justify-center gap-6 py-4 text-sm text-white">
          {hoveredCategory && 
            menues.find((menu) => menu.name === hoveredCategory)?.subMenu.map((sub, index) => (
              "component" in sub ? (
                <div key={index}>{sub.component}</div>
              ) : (
                <div 
                  key={sub.label}
                  className="cursor-pointer hover:text-gray-300"
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
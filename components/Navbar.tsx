"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, ReactNode } from "react";
import Search from "./Search";

type SubMenuItem = 
  | { component: ReactNode }
  | { label: string; route: string };

type Menu = {
  name: string;
  subMenu: SubMenuItem[];
};

export default function Navbar() {
  const { userData, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const menues: Menu[] = [
    { 
      name: "게시판", 
      subMenu: [
        { label: "자유", route: "/board/free" },
        { label: "캐릭터", route: "/board/character" },
        { label: "아이템", route: "/board/item" },
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

  const profileMenus = [
    { label: "내 정보", action: () => router.push("/profile") },
    { label: "로그아웃", action: async () => { await logout(); router.push("/login"); } }
  ];

  // 🔹 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return pathname === "/login" ? null : (
    <nav className="w-full bg-black text-white border-b border-white/20 relative z-40">
      <div className="flex px-6 py-3 items-center justify-between">
        {/* 좌측: 로고 */}
        <div
          className="text-xl md:text-2xl font-bold cursor-pointer hover:text-gray-300 transition"
          onClick={() => router.push("/")}
        >
          RPAVER
        </div>

        {/* 가운데: 메뉴 */}
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

        {/* 🔹 우측: 유저 정보 (프로필) */}
        <div ref={dropdownRef} className="relative z-50">
          <div
            className="flex items-center gap-2 cursor-pointer hover:scale-[1.05] transition"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <span className="text-sm text-gray-300">{userData?.name || "-"}</span>
            <img
              src={userData?.picture || "https://firebasestorage.googleapis.com/v0/b/rp-encyclopedia.appspot.com/o/profilePictures%2FYDW4AGtVZNNxOYznMc2m0DFoxlF2?alt=media&token=248ffc43-c07a-4e88-98e6-713c8394bb33"}
              alt="프로필"
              className="rounded-full w-10 border border-white/20 aspect-square object-cover"
            />
          </div>

          {/* 🔹 드롭다운 메뉴 */}
          <div className={`absolute right-0 mt-2 w-40 bg-gray-800 border border-white/10 rounded-lg shadow-lg z-50 transition-all duration-300
            ${isDropdownOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
          >
            {profileMenus.map((menu, index) => (
              <div
                key={index}
                className="px-4 py-2 text-sm hover:bg-gray-700 cursor-pointer transition"
                onClick={() => { 
                  menu.action(); 
                  setDropdownOpen(false);
                }}
              >
                {menu.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔹 하위 메뉴 확장 영역 */}
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
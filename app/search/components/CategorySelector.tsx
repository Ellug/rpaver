"use client";

import { useRouter, useParams } from "next/navigation";

const categories = [
  // { name: "전체", value: "all" },
  // { name: "자유", value: "free" },
  { name: "캐릭터", value: "character" },
  // { name: "아이템", value: "items" },
  // { name: "히스토리", value: "history" },
  // { name: "설정", value: "worldset" },
  { name: "갤러리", value: "gallery" },
];

export default function CategorySelector({ currentCategory }: { currentCategory: string }) {
  const router = useRouter();
  const params = useParams();
  const queryText = params.query as string;

  const handleCategoryChange = (value: string) => {
    if (!queryText) return;
    router.push(`/search/${queryText}?category=${value}`);
  };

  return (
    <div className="flex space-x-4 border-b border-opacity-50 pb-2 mb-4">
      {categories.map((cat) => (
        <button
          key={cat.value}
          className={`relative px-4 py-2 text-black rounded-md font-bold hover:scale-[1.1] overflow-hidden ${
            cat.value === currentCategory ? "text-white scale-[1.1]" : "bg-gray-200"
          }`}
          onClick={() => handleCategoryChange(cat.value)}
        >
          {cat.value === currentCategory && (
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-85"></span>
          )}
          <span className="relative z-10">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

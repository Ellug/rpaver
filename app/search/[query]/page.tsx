"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CategorySelector from "../components/CategorySelector";
import CharacterResults from "../components/CharacterResults";
// import ItemSearchResults from "./ItemSearchResults";
// import HistorySearchResults from "./HistorySearchResults";
// import GallerySearchResults from "./GallerySearchResults";
// import WorldSetSearchResults from "./WorldSetSearchResults";

export default function SearchResults() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryValue = searchParams.get("category") || "all";
  const [queryText, setQueryText] = useState<string>("");

  useEffect(() => {
    if (!params.query) return;
    setQueryText(decodeURIComponent(params.query as string));
  }, [params.query]);

  return (
    <div className="max-w-6xl mx-auto mt-12">
      <CategorySelector currentCategory={categoryValue} />

      <h2 className="mt-6 text-xl font-semibold mb-4">🔍 <span className="font-bold text-2xl mx-2">{queryText}</span> 검색 결과</h2>

      {/* 선택된 카테고리에 따라 다른 결과 컴포넌트 렌더링 */}
      {categoryValue === "character" && <CharacterResults queryText={queryText} />}
      {/* categoryValue === "items" && <ItemSearchResults queryText={queryText} /> */}
      {/* categoryValue === "history" && <HistorySearchResults queryText={queryText} /> */}
      {/* categoryValue === "gallery" && <GallerySearchResults queryText={queryText} /> */}
      {/* categoryValue === "worldset" && <WorldSetSearchResults queryText={queryText} /> */}
    </div>
  );
}

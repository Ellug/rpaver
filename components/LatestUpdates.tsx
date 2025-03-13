"use client";

import { useState, useEffect } from "react";
import { db } from "@/libs/firebaseConfig";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface FirestoreDocument {
  id: string;
  updatedAt?: Timestamp; // Firestore Timestamp 유지
  [key: string]: string | undefined | Timestamp; // updatedAt도 허용
}

interface LatestUpdatesProps {
  title: string;
  collectionName: string;
  fields: string[]; // 표시할 필드
  sendFields: string[]; // 전송할 필드 (URL 또는 sessionStorage)
  navigateTo: string; // 이동할 경로
  mode: string;
}

export default function LatestUpdates({ title, collectionName, fields, sendFields, navigateTo, mode }: LatestUpdatesProps) {
  const router = useRouter();
  const [data, setData] = useState<FirestoreDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const q = query(collection(db, collectionName), orderBy("updatedAt", "desc"), limit(10));
        const snapshot = await getDocs(q);

        const fetchedData: FirestoreDocument[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setData(fetchedData);
      } catch (error) {
        console.error("🔥 데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestData();
  }, [collectionName]);

  // 리스트 클릭 시 해당 게시물로 이동
  const handleItemClick = (item: FirestoreDocument) => {
    if (mode === "url") {
      router.push(`${navigateTo}${encodeURIComponent(item.id)}`);
    } else if (mode === "sessionStorage") {
      const dataToStore = sendFields.reduce((acc, field) => {
        acc[field] = item[field] as string || "";
        return acc;
      }, {} as Record<string, string>);
  
      sessionStorage.setItem("selectedData", JSON.stringify(dataToStore));
      router.push(navigateTo);
    }
  };
  

  return (
    <div className="w-auto md:w-[600px] mt-10 bg-gray-900/50 p-4 rounded-lg shadow-lg text-white border border-gray-700">
      <h2 className="text-lg font-bold text-white/80 mb-3">{title}</h2>

      {loading ? (
        <p className="text-gray-400 text-center">로딩 중...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-400 text-center">데이터가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((item) => (
            <li
              key={item.id}
              className="bg-gray-900 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex gap-8">
                {fields.map((field) => (
                  <p key={field} className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{field}:</span> {item[field] as string || "없음"}
                  </p>
                ))}
              </div>
              <p className="text-end text-xs text-gray-400 mt-2">
                업데이트: {item.updatedAt instanceof Timestamp ? item.updatedAt.toDate().toLocaleString("ko-KR") : "N/A"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
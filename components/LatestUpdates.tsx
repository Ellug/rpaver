"use client";

import { useState, useEffect } from "react";
import { db } from "@/libs/firebaseConfig";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface FirestoreDocument {
  id: string;
  updatedAt?: Timestamp;
  [key: string]: string | undefined | Timestamp;
}

interface LatestUpdatesProps {
  title: string;
  collectionName: string;
  fields: string[];
  sendFields: string[];
  navigateTo: string;
  mode: string;
}

export default function LatestUpdates({ title, collectionName, fields, sendFields, navigateTo, mode }: LatestUpdatesProps) {
  const router = useRouter();
  const { prevLogin } = useAuth();
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
    <div className="w-auto md:w-[600px] bg-gray-900/50 p-4 rounded-lg shadow-lg text-white border border-gray-700">
      <h2 className="text-lg font-bold text-white/80 mb-3">{title}</h2>

      {loading ? (
        <p className="text-gray-400 text-center">로딩 중...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-400 text-center">데이터가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((item) => {
            const updatedAt = item.updatedAt instanceof Timestamp ? item.updatedAt : null;
            const isNew = prevLogin && updatedAt ? updatedAt.toMillis() > prevLogin.toMillis() : false; // NEW 여부 판단

            return (
              <li
                key={item.id}
                className="bg-gray-900 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {fields.map((field) => (
                      <p key={field} className="text-sm text-gray-300">
                        {item[field] as string || ""}
                      </p>
                    ))}
                  </div>

                  {/* NEW 태그 표시 */}
                  {isNew && <span className="text-gold text-sm font-bold ml-2">NEW</span>}
                </div>

                <p className="text-end text-xs text-gray-400 mt-2">
                  업데이트: {updatedAt ? updatedAt.toDate().toLocaleString("ko-KR") : "N/A"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

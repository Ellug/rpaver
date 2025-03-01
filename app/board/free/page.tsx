"use client";

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, startAfter, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import LoadingModal from "@/components/LoadingModal";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

type Post = {
  id: string;
  title: string;
  authorUid: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: number;
};

export default function FreeBoard() {
  const router = useRouter();
  const { users } = useUserContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const postsPerPage = 20;

  useEffect(() => {
    fetchTotalPosts();
    fetchPosts(1);
  }, []);

  // 🔹 Firestore에서 총 게시물 수 가져오기 (한 번만 실행)
  const fetchTotalPosts = async () => {
    try {
      const countSnap = await getCountFromServer(collection(db, "free_board"));
      setTotalPosts(countSnap.data().count);
    } catch (error) {
      console.error("🔥 총 게시물 수 가져오기 실패:", error);
    }
  };

  // 🔹 Firestore에서 20개씩 최신순으로 가져오기
  const fetchPosts = async (page: number) => {
    if (loading) return;
    setLoading(true);

    try {
      let postsQuery = query(
        collection(db, "free_board"),
        orderBy("createdAt", "desc"),
        limit(postsPerPage)
      );

      if (page > 1 && lastVisible) {
        postsQuery = query(postsQuery, startAfter(lastVisible));
      }

      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts: Post[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "제목 없음",
          authorUid: data.author || "",
          views: data.views || 0,
          likes: Array.isArray(data.likes) ? data.likes.length : 0,
          comments: Array.isArray(data.comments) ? data.comments.length : 0,
          createdAt: data.createdAt.toMillis(),
        };
      });

      setPosts(fetchedPosts);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setCurrentPage(page);
    } catch (error) {
      console.error("🔥 게시글 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 페이지 변경 함수
  const changePage = (pageNumber: number) => {
    if (pageNumber !== currentPage) {
      fetchPosts(pageNumber);
    }
  };

  // 🔹 총 페이지 수 계산
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // 🔹 게시글 클릭 시 상세 페이지 이동
  const handleRowClick = (id: string) => {
    router.push(`/board/free/detail/${id}`);
  };

  // 🔹 테이블 헤더 데이터 배열
  const tableHeaders = [
    { key: "title", label: "제목", className: "w-auto text-left" },
    { key: "author", label: "작성자", className: "w-36 text-left" },
    { key: "views", label: "조회수", className: "w-20 text-center max-md:hidden" },
    { key: "likes", label: "좋아요", className: "w-20 text-center max-md:hidden" },
    { key: "comments", label: "댓글", className: "w-20 text-center max-md:hidden" },
    { key: "createdAt", label: "등록일", className: "w-32 text-center max-md:hidden" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {loading && <LoadingModal />}

      <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
        <h1 className="text-2xl font-bold mb-4">자유 게시판</h1>

        {/* 🔹 글쓰기 버튼 */}
        <button
          onClick={() => router.push("/board/free/add")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
        >
          글쓰기
        </button>
      </div>

      {/* 🔹 게시글 목록 */}
      <div className="overflow-x-auto text-sm">
        <table className="w-full border border-gray-800 table-fixed">
          <thead>
            <tr className="bg-gray-900 text-white">
              {tableHeaders.map((header) => (
                <th key={header.key} className={`border px-4 py-3 ${header.className}`}>
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const author = users[post.authorUid] || { name: "알 수 없음", picture: "/default-profile.png" };
              const rowData = [
                { key: "title", value: post.title, className: "text-left truncate" },
                {
                  key: "author",
                  value: (
                    <div className="flex items-center gap-2">
                      <img src={author.picture || "/default-profile.png"} alt={author.name} className="w-6 h-6 rounded-full" />
                      <span className="truncate">{author.name}</span>
                    </div>
                  ),
                  className: "text-left",
                },
                { key: "views", value: post.views, className: "text-center max-md:hidden" },
                { key: "likes", value: post.likes, className: "text-center max-md:hidden" }, // 🔥 배열 길이로 변환된 값
                { key: "comments", value: post.comments, className: "text-center max-md:hidden" }, // 🔥 배열 길이로 변환된 값
                { key: "createdAt", value: new Date(post.createdAt).toLocaleDateString("ko-KR"), className: "text-center text-gray-400 max-md:hidden" },
              ];

              return (
                <tr key={post.id} onClick={() => handleRowClick(post.id)} className="hover:bg-gray-800 cursor-pointer">
                  {rowData.map((data) => (
                    <td key={data.key} className={`border px-4 py-3 ${data.className}`}>
                      {data.value}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🔹 페이지네이션 버튼 */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => changePage(index + 1)}
            className={`px-3 py-1 rounded-md ${
              currentPage === index + 1 ? "bg-blue-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
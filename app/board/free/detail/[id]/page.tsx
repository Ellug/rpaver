"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "@/libs/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useUserContext } from "@/contexts/UserContext";
import { Check, Edit, ThumbsDown, ThumbsUp, Trash, X } from "lucide-react";
import LoadingModal from "@/components/LoadingModal";
import { deleteObject, ref } from "firebase/storage";

type Comment = {
  id: string;
  authorUid: string;
  content: string;
  createdAt: number;
};

type Post = {
  id: string;
  title: string;
  content: string;
  authorUid: string;
  images: string[];
  views: number;
  likes: string[];
  dislikes: string[];
  comments: Comment[];
  createdAt: number;
};

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const { users } = useUserContext();

  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const docRef = doc(db, "free_board", id as string);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          alert("게시글을 찾을 수 없습니다.");
          router.back();
          return;
        }

        const postData = docSnap.data();
        const commentsArray = Array.isArray(postData.comments) ? postData.comments : [];
        const likesArray = Array.isArray(postData.likes) ? postData.likes : [];
        const dislikesArray = Array.isArray(postData.dislikes) ? postData.dislikes : [];

        setPost({
          id: docSnap.id,
          title: postData.title,
          content: postData.content,
          authorUid: postData.author,
          views: postData.views || 0,
          likes: likesArray,
          dislikes: dislikesArray,
          images: postData.images,
          comments: commentsArray.sort((a, b) => a.createdAt - b.createdAt),
          createdAt: postData.createdAt.toMillis(),
        });

        // Firestore 트랜잭션으로 조회수 증가
        await updateDoc(docRef, { views: increment(1) });
      } catch (error) {
        console.error("🔥 게시글 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 좋아요 버튼 (중복 방지)
  const handleLike = async () => {
    if (!id || !post || !userData) return;
    const postRef = doc(db, "free_board", id as string);
    
    let updatedLikes = [...post.likes];
    let updatedDislikes = [...post.dislikes];

    if (updatedLikes.includes(userData.uid)) {
      // 이미 좋아요 → 좋아요 취소
      updatedLikes = updatedLikes.filter((uid) => uid !== userData.uid);
    } else {
      // 좋아요 추가 (싫어요 되어있으면 취소)
      updatedLikes.push(userData.uid);
      updatedDislikes = updatedDislikes.filter((uid) => uid !== userData.uid);
    }
    setLoading(true);
    try {
      await updateDoc(postRef, { likes: updatedLikes, dislikes: updatedDislikes });
      setPost((prev) => prev ? { ...prev, likes: updatedLikes, dislikes: updatedDislikes } : null);
    } catch (error) {
      console.error("🔥 좋아요 업데이트 실패:", error);
    }
    setLoading(false);
  };

  // 싫어요 버튼 (중복 방지)
  const handleDislike = async () => {
    if (!id || !post || !userData) return;
    const postRef = doc(db, "free_board", id as string);

    let updatedLikes = [...post.likes];
    let updatedDislikes = [...post.dislikes];
    
    if (updatedDislikes.includes(userData.uid)) {
      // 이미 싫어요 → 싫어요 취소
      updatedDislikes = updatedDislikes.filter((uid) => uid !== userData.uid);
    } else {
      // 싫어요 추가 (좋아요 되어있으면 취소)
      updatedDislikes.push(userData.uid);
      updatedLikes = updatedLikes.filter((uid) => uid !== userData.uid);
    }
    
    setLoading(true);
    try {
      await updateDoc(postRef, { likes: updatedLikes, dislikes: updatedDislikes });
      setPost((prev) => prev ? { ...prev, likes: updatedLikes, dislikes: updatedDislikes } : null);
    } catch (error) {
      console.error("🔥 싫어요 업데이트 실패:", error);
    }
    setLoading(false);
  };

  // 좋아요/싫어요 여부 확인
  const isLiked = post?.likes.includes(userData?.uid || "");
  const isDisliked = post?.dislikes.includes(userData?.uid || "");

  // 게시글 삭제 (본인만 가능)
  const handleDelete = async () => {
    if (!id || !post) return;
    if (!(post.authorUid === userData?.uid || userData?.admin === true)) return alert("삭제 권한이 없습니다.");
    if (!confirm("정말 삭제하시겠습니까?")) return;
  
    setLoading(true);
  
    try {
      // Firestore에서 이미지 URL 목록 가져오기
      const imageUrls = post.images || []; // Firestore에서 저장된 이미지 목록 가져오기
  
      // Firebase Storage에서 이미지 삭제
      for (const url of imageUrls) {
        try {
          const imageRef = ref(storage, url);
          await deleteObject(imageRef);
          console.log(`🗑️ 이미지 삭제 완료: ${url}`);
        } catch (error) {
          console.error(`🔥 이미지 삭제 실패: ${url}`, error);
        }
      }
  
      // Firestore에서 게시글 삭제
      await deleteDoc(doc(db, "free_board", id as string));
  
      alert("게시글이 삭제되었습니다.");
      router.push("/board/free");
    } catch (error) {
      console.error("🔥 게시글 삭제 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성
  const handleAddComment = async () => {
    if (!userData || !post) return alert("로그인이 필요합니다.");
    if (!newComment.trim()) return;
  
    try {
      const postRef = doc(db, "free_board", id as string);
      const newCommentData: Comment = {
        id: Date.now().toString(),
        authorUid: userData.uid,
        content: newComment,
        createdAt: Date.now(),
      };
  
      await updateDoc(postRef, {
        comments: [...post.comments, newCommentData],
      });
  
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [newCommentData, ...prev.comments],
            }
          : null
      );
  
      setNewComment("");
    } catch (error) {
      console.error("🔥 댓글 추가 실패:", error);
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId: string) => {
    if (!post || !userData) return;
    const postRef = doc(db, "free_board", id as string);
    const updatedComments = post.comments.map((comment) =>
      comment.id === commentId && comment.content !== editCommentText
        ? { ...comment, content: editCommentText }
        : comment
    );

    setLoading(true);
    try {
      await updateDoc(postRef, { comments: updatedComments });
  
      setPost((prev) =>
        prev ? { ...prev, comments: updatedComments } : null
      );
  
      setEditCommentId(null);
      setEditCommentText("");
    } catch (error) {
      console.error("🔥 댓글 수정 실패:", error);
    }
    setLoading(false);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditCommentId(null);
    setEditCommentText("");
  };
  
  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!post || !userData) return;
    const postRef = doc(db, "free_board", id as string);
    const updatedComments = post.comments.filter((comment) => comment.id !== commentId);
  
    setLoading(true);
    try {
      await updateDoc(postRef, { comments: updatedComments });
  
      setPost((prev) =>
        prev ? { ...prev, comments: updatedComments } : null
      );
    } catch (error) {
      console.error("🔥 댓글 삭제 실패:", error);
    }
    setLoading(false);
  };

  if (!post) return <p>게시글이 없습니다.</p>;

  // 유저 정보 가져오기
  const author = users[post.authorUid] || { name: "알 수 없음", picture: "/default-profile.png" };
  const isAdmin = userData?.admin === true;
  const canEdit = post.authorUid === userData?.uid || isAdmin;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      {loading && <LoadingModal />}

      {/* 제목 */}
      <h1 className="text-3xl font-bold">{post.title}</h1>

      <hr className="my-6 opacity-30" />

      {/* 작성자 & 조회수 */}
      <div className="flex items-center gap-3 text-gray-400 mt-8">
        <img src={author.picture} alt="user picture" className="w-36 h-36 rounded-xl" />
        <div className="ml-4">
          <div className="mb-4">
            <span className="text-xl text-white">{author.name}</span>
            <p className="mt-6 text-sm">조회수: {post.views}</p>
            <p className="text-sm">{new Date(post.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {canEdit && (
          <div className="ml-auto mr-8 flex flex-col gap-4">
            {/* <button onClick={() => router.push(`/board/free/edit/${id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-md">
              글 수정
            </button> */}
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">
              글 삭제
            </button>
          </div>
        )}
      </div>

      <hr className="my-6 opacity-30" />

      {/* 게시글 본문 */}
      <div
        className="mt-12 text-lg whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: post.content
            .replace(/<p>\s*<\/p>/g, "<br>") // 🔥 빈 <p></p> 태그를 <br><br>로 변환
        }}
      />

      {/* 댓글 목록 */}
      <div className="mt-8">
        <div className="flex items-center">
          <h2 className="py-4 text-xl font-bold">댓글 ({post.comments.length})</h2>

          {/* 좋아요, 싫어요 버튼 */}
          <div className="flex items-center space-x-4">
            <button onClick={handleLike} className="flex items-center px-3 py-2">
              <ThumbsUp className={`w-6 h-6 ${isLiked ? "fill-blue-500 stroke-blue-500" : "stroke-white"}`} />
              <span className="ml-2">{post.likes.length}</span>
            </button>
            
            <button onClick={handleDislike} className="flex items-center px-3 py-2">
              <ThumbsDown className={`w-6 h-6 ${isDisliked ? "fill-red-500 stroke-red-500" : "stroke-white"}`} />
              <span className="ml-2">{post.dislikes.length}</span>
            </button>
          </div>
        </div>

        {post.comments.map((comment) => {
          const commentAuthor = users[comment.authorUid] || { name: "알 수 없음", picture: "/default-profile.png" };
          const canEditComment = comment.authorUid === userData?.uid || isAdmin;

          return (
            <div key={comment.id} className="border-t border-gray-700 py-6">
              <div className="flex items-start gap-2">
                <img src={commentAuthor.picture} alt="user picture" className="w-28 h-28 rounded-lg mr-4" />
                <div className="flex-1">
                  <p className="font-bold">
                    {commentAuthor.name} 
                    <span className="ml-4 text-gray-600 text-sm">
                      {new Date(comment.createdAt).toLocaleString("ko-KR")}
                    </span>
                  </p>
                  {editCommentId === comment.id ? (
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="w-full p-2 text-black border rounded-md mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-white whitespace-pre-line">{comment.content}</p>
                  )}
                </div>
                {canEditComment && (
                  <div className="ml-auto flex gap-2">
                    {editCommentId === comment.id ? (
                      <>
                        <Check onClick={() => handleEditComment(comment.id)} className="cursor-pointer text-green-500 w-5 h-5" />
                        <X onClick={handleCancelEdit} className="cursor-pointer text-gray-500 w-5 h-5" />
                      </>
                    ) : (
                      <>
                        <Edit onClick={() => {
                          setEditCommentId(comment.id);
                          setEditCommentText(comment.content);
                        }} className="cursor-pointer text-white w-5 h-5" />
                        <Trash onClick={() => handleDeleteComment(comment.id)} className="cursor-pointer text-red-500 w-5 h-5" />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 댓글 입력 */}
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="w-full p-2 mt-12 text-black border rounded-md"
        placeholder="댓글 입력..."
      />
      <div className="flex justify-end">
        <button onClick={handleAddComment} className="px-4 py-2 my-4 bg-blue-600 text-white rounded-md">
          댓글 등록
        </button>
      </div>
    </div>
  );
}
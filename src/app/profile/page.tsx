"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth, storage } from "@/libs/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updatePassword } from "firebase/auth";
import LoadingModal from "@/components/LoadingModal";

export default function ProfilePage() {
  const { userData, setUserData } = useAuth();
  const [name, setName] = useState(userData?.name || "");
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState<string | null>(userData?.picture || "/default-profile.png");
  const [picture, setPicture] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 프로필 이미지 선택 시 미리보기 적용
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPicture(file);
      setPreview(URL.createObjectURL(file)); // 미리보기 이미지 생성
    }
  };

// 🔹 프로필 업데이트 (이름 및 사진)
const handleUpdateProfile = async () => {
  if (!userData) return;
  setLoading(true);

  try {
    let pictureUrl = userData.picture;

    if (picture) {
      const imageRef = ref(storage, `profilePictures/${userData.uid}`);
      await uploadBytes(imageRef, picture);
      pictureUrl = await getDownloadURL(imageRef);
    }

    const updatedUserData = {
      ...userData,
      name,
      picture: pictureUrl,
    };

    await updateDoc(doc(db, "users", userData.uid), updatedUserData);

    // 🔥 **로컬 상태 업데이트 → 즉시 반영**
    setUserData(updatedUserData);

    alert("프로필이 업데이트되었습니다.");
  } catch (error) {
    console.error("🔥 프로필 업데이트 실패:", error);
  } finally {
    setLoading(false);
  }
};


  // 🔹 비밀번호 변경
  const handleUpdatePassword = async () => {
    if (!password) return alert("변경할 비밀번호를 입력하세요.");
    setLoading(true);

    try {
      if (!auth.currentUser) throw new Error("사용자 인증 정보 없음");
      await updatePassword(auth.currentUser, password);
      alert("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
    } catch (error) {
      console.error("🔥 비밀번호 변경 실패:", error);
      alert("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-10 p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      {loading && <LoadingModal />}

      <h1 className="text-2xl font-bold text-gold mb-4 text-center">내 정보</h1>

      {/* 🔹 프로필 이미지 업로드 & 미리보기 */}
      <div className="flex flex-col items-center mb-4 relative">
        <div className="relative w-24 h-24">
          <img
            src={preview as string}
            alt="프로필"
            className="rounded-full border border-white/20 object-cover aspect-square"
          />
          <label className="absolute bottom-0 right-0 bg-blue-600 text-xs text-white px-2 py-1 rounded-full cursor-pointer">
            변경
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      {/* 🔹 이름 변경 */}
      <div className="mb-4">
        <label className="block text-gray-400 mb-1">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded-md text-white"
        />
      </div>

      <button
        onClick={handleUpdateProfile}
        className="w-full p-2 bg-blue-600 rounded-md hover:bg-blue-500 transition"
      >
        프로필 업데이트
      </button>

      <hr className="my-6 border-gray-600" />

      {/* 🔹 비밀번호 변경 */}
      <div className="mb-4">
        <label className="block text-gray-400 mb-1">새 비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded-md text-white"
          placeholder="변경할 비밀번호 입력"
        />
      </div>

      <button
        onClick={handleUpdatePassword}
        className="w-full p-2 bg-red-600 rounded-md hover:bg-red-500 transition"
      >
        비밀번호 변경
      </button>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { storage } from "@/libs/firebaseConfig";
import { ref, listAll, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import LoadingModal from "@/components/LoadingModal";

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [files, setFiles] = useState<{ name: string; url?: string; isFolder: boolean }[]>([]);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ▼ 추가된 상태: 목적지 폴더 선택을 위한 상태들
  const [showDestinationPicker, setShowDestinationPicker] = useState<boolean>(false);
  const [destinationPath, setDestinationPath] = useState<string>("/");
  const [destinationFolders, setDestinationFolders] = useState<{ name: string; isFolder: boolean }[]>([]);

  // =====================
  //  메인 파일/폴더 로딩
  // =====================
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const storageRef = ref(storage, currentPath);
      const result = await listAll(storageRef);

      // 파일 정보 로딩
      const newFiles = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url, isFolder: false };
        })
      );

      // 폴더 정보
      const newFolders = result.prefixes.map((folder) => ({
        name: folder.name,
        isFolder: true,
      }));

      setFiles([...newFolders, ...newFiles]);
    } catch (error) {
      console.error("🔥 파일 목록 불러오기 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  // =====================
  //   뒤로가기 기능
  // =====================
  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      setCurrentPath("/" + parts.slice(0, -1).join("/"));
    }
  };

  // =====================
  //   폴더 생성/삭제
  // =====================
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return alert("폴더명을 입력하세요.");
    setIsLoading(true);
    try {
      const folderRef = ref(storage, `${currentPath}/${newFolderName}/dummy.txt`);
      const dummyBlob = new Blob([""], { type: "text/plain" });
      await uploadBytes(folderRef, dummyBlob);
      alert("폴더가 생성되었습니다.");
      setNewFolderName("");
      fetchFiles();
    } catch (error) {
      console.error("🔥 폴더 생성 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (!window.confirm(`"${folderName}" 폴더를 삭제하시겠습니까? (내부 파일 포함)`)) return;
    setIsLoading(true);
    try {
      const folderRef = ref(storage, `${currentPath}/${folderName}`);
      const folderContents = await listAll(folderRef);

      for (const file of folderContents.items) {
        await deleteObject(file);
      }
      alert("폴더가 삭제되었습니다.");
      fetchFiles();
    } catch (error) {
      console.error("🔥 폴더 삭제 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================
  //   파일 업로드/삭제
  // =====================
  const handleDeleteFile = async (fileName: string) => {
    if (!window.confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) return;
    setIsLoading(true);
    try {
      const fileRef = ref(storage, `${currentPath}/${fileName}`);
      await deleteObject(fileRef);
      alert("파일이 삭제되었습니다.");
      fetchFiles();
    } catch (error) {
      console.error("🔥 파일 삭제 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    setIsLoading(true);

    try {
      await Promise.all(
        files.map(async (file) => {
          const filePath = `${currentPath}/${file.name}`;
          const fileRef = ref(storage, filePath);
          await uploadBytes(fileRef, file);
        })
      );
      alert("파일 업로드 성공!");
      fetchFiles();
    } catch (error) {
      console.error("🔥 파일 업로드 오류:", error);
    } finally {
      event.target.value = ""; // 업로드 완료 후 input 초기화
      setIsLoading(false);
    }
  };

  // =====================
  //   파일 선택/이동
  // =====================
  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]
    );
  };

  const handleMoveFiles = async (destPath: string) => {
    if (selectedFiles.length === 0) return;
    if (!window.confirm(`"${selectedFiles.join(", ")}"을(를) "${destPath}" 폴더로 이동하시겠습니까?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/moveFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: selectedFiles.map((file) => ({
            oldPath: `${currentPath}/${file}`,
            newPath: `${destPath}/${file}`, // 목적지: destPath
          })),
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "파일 이동 실패");
      }

      alert("파일 이동 성공!");
      // 이동 후 원본 화면 새로고침
      fetchFiles();
    } catch (error) {
      console.error("🔥 파일 이동 오류:", error);
    } finally {
      // 선택 초기화 & 목적지 선택 UI 닫기
      setSelectedFiles([]);
      setShowDestinationPicker(false);
      setIsLoading(false);
    }
  };

  // 이미지 파일 판별
  const isImageFile = (fileName: string) => {
    return /\.(jpeg|jpg|png|gif|webp)$/i.test(fileName);
  };

  // =====================
  //  목적지 폴더 탐색
  // =====================
  const fetchDestinationFolders = async (path: string) => {
    setIsLoading(true);
    try {
      const destinationRef = ref(storage, path);
      const result = await listAll(destinationRef);

      // 폴더만 표시 (파일은 목적지 선택과 직접 관련 없으므로 생략 가능)
      const folders = result.prefixes.map((folder) => ({
        name: folder.name,
        isFolder: true,
      }));
      setDestinationFolders(folders);
    } catch (error) {
      console.error("🔥 목적지 폴더 목록 불러오기 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 목적지 선택 UI 열기
  const handleOpenDestinationPicker = () => {
    if (selectedFiles.length === 0) return;
    setDestinationPath("/"); // 초기값은 루트로
    setShowDestinationPicker(true);
    fetchDestinationFolders("/"); // 루트 폴더 목록 로딩
  };

  // 목적지 폴더 진입
  const handleDestinationClick = (folderName: string) => {
    const newPath = destinationPath === "/" ? `/${folderName}` : `${destinationPath}/${folderName}`;
    setDestinationPath(newPath);
  };

  // 목적지 뒤로가기
  const handleDestinationBack = () => {
    const parts = destinationPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      const newPath = "/" + parts.slice(0, -1).join("/");
      setDestinationPath(newPath || "/");
    }
  };

  // 목적지 경로 바뀔 때마다 폴더 목록 갱신
  useEffect(() => {
    if (showDestinationPicker) {
      fetchDestinationFolders(destinationPath);
    }
  }, [destinationPath, showDestinationPicker]);

  // =====================
  //        렌더링
  // =====================
  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-6xl mx-auto">
      {isLoading && <LoadingModal />}

      <h1 className="text-2xl font-bold mb-4">📁 파일 관리자</h1>

      {/* 현재 경로 네비게이션 */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-400">현재 경로: {currentPath}</p>
        {currentPath !== "/" && (
          <button className="text-blue-400 hover:underline" onClick={handleBack}>
            ⬅️ 뒤로 가기
          </button>
        )}
      </div>

      {/* 파일/폴더 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 border border-gray-700 rounded-lg p-4">
        {files.map((file) => {
          if (file.isFolder) {
            // 폴더
            return (
              <div key={file.name}>
                <div className="flex flex-col items-start">
                  <button
                    className="text-blue-400 hover:underline mb-2"
                    onClick={() => setCurrentPath(`${currentPath}/${file.name}`)}
                  >
                    📂 {file.name}
                  </button>
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteFolder(file.name)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          } else {
            // 파일
            if (file.url && isImageFile(file.name)) {
              const isSelected = selectedFiles.includes(file.name);
              return (
                <div key={file.name} className="flex flex-col items-center">
                  <div
                    onClick={() => toggleFileSelection(file.name)}
                    className={`cursor-pointer border rounded-md ${
                      isSelected ? "border-4 border-blue-400" : "border-gray-600"
                    }`}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="object-contain w-full h-32 md:h-48"
                    />
                  </div>
                  <button
                    className="text-red-400 hover:text-red-300 mt-2"
                    onClick={() => handleDeleteFile(file.name)}
                  >
                    삭제
                  </button>
                </div>
              );
            } else {
              return (
                <div key={file.name} className="flex flex-col">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:underline mb-2"
                  >
                    📄 {file.name}
                  </a>
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteFile(file.name)}
                  >
                    삭제
                  </button>
                </div>
              );
            }
          }
        })}
      </div>

      {/* 파일 이동 버튼 (선택된 파일이 있을 때만 보임) */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-blue-600 rounded-md"
            onClick={handleOpenDestinationPicker}
          >
            Move files
          </button>
        </div>
      )}

      {/* ▼ 목적지 폴더 탐색 UI (showDestinationPicker가 true일 때 보임) */}
      {showDestinationPicker && (
        <div className="mt-8 p-4 border border-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">📦 이동할 폴더 선택</h2>
          {/* 목적지 경로 */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-300">목적지: {destinationPath}</p>
            {destinationPath !== "/" && (
              <button
                className="text-blue-400 hover:underline"
                onClick={handleDestinationBack}
              >
                ⬅️ 뒤로 가기
              </button>
            )}
          </div>

          {/* 목적지 폴더 목록 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {destinationFolders.map((folder) => (
              <button
                key={folder.name}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white text-left"
                onClick={() => handleDestinationClick(folder.name)}
              >
                📂 {folder.name}
              </button>
            ))}
          </div>

          {/* 이동 & 취소 버튼 */}
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 rounded-md"
              onClick={() => handleMoveFiles(destinationPath)}
            >
              여기로 이동하기
            </button>
            <button
              className="px-4 py-2 bg-gray-600 rounded-md"
              onClick={() => setShowDestinationPicker(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 폴더 생성 */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="새 폴더 이름"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="p-2 bg-gray-700 rounded-md text-white"
        />
        <button className="px-4 py-2 bg-blue-600 rounded-md" onClick={handleCreateFolder}>
          폴더 추가
        </button>
      </div>

      {/* 파일 업로드 */}
      <div className="mt-4">
        <input type="file" multiple onChange={handleFileUpload} className="text-gray-300" />
      </div>
    </div>
  );
}

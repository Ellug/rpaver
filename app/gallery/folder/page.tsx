"use client";

import React, { useState, useEffect } from "react";
import { storage } from "@/libs/firebaseConfig";
import { ref, listAll, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import LoadingModal from "@/components/LoadingModal";
import { useCharacterContext } from "@/contexts/CharacterContext";

export default function FileManager() {
  const { characterNames } = useCharacterContext();
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [files, setFiles] = useState<{ name: string; url?: string; isFolder: boolean }[]>([]);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 🔹 현재 경로의 파일 및 폴더 가져오기
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const storageRef = ref(storage, currentPath);
      const result = await listAll(storageRef);

      const newFiles = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url, isFolder: false };
        })
      );

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

  // 🔹 뒤로가기 기능
  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      setCurrentPath("/" + parts.slice(0, -1).join("/"));
    }
  };

  // 🔹 폴더 추가 기능
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

  // 🔹 폴더 삭제 기능
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

  // 🔹 파일 삭제 기능 (이미지 포함)
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

  // 🔹 파일 업로드 (여러 개)
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
      event.target.value = ""; // 🔹 업로드 완료 후 input 초기화
      setIsLoading(false);
    }
  };

  // 🔹 파일 선택 토글
  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]
    );
  };

  // 🔹 파일 이동 기능 (여러 개 이동 가능)
  const handleMoveFiles = async (destinationFolder: string) => {
    if (selectedFiles.length === 0) return;
    if (!window.confirm(`"${selectedFiles.join(", ")}"을(를) "${destinationFolder}" 폴더로 이동하시겠습니까?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/moveFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: selectedFiles.map((file) => ({
            oldPath: `${currentPath}/${file}`,
            newPath: `charactersIMG/${destinationFolder}/${file}`,
          })),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "파일 이동 실패");
      }

      console.log("✅ 파일 이동 성공:", result.message);
      alert("파일 이동 성공!");
      fetchFiles(); // 이동 후 파일 목록 갱신
    } catch (error) {
      console.error("🔥 파일 이동 오류:", error);
    } finally {
      setSelectedFiles([]); // 선택 초기화
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {isLoading && <LoadingModal />} {/* 🔹 로딩 중일 때 모달 표시 */}

      <h1 className="text-2xl font-bold mb-4">📁 파일 관리자</h1>

      {/* 🔹 경로 네비게이션 */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-400">현재 경로: {currentPath}</p>
        {currentPath !== "/" && (
          <button className="text-blue-400 hover:underline" onClick={handleBack}>⬅️ 뒤로 가기</button>
        )}
      </div>

      {/* 🔹 파일 및 폴더 리스트 */}
      <div className="border border-gray-700 rounded-lg p-4">
        {files.map((file) => (
          <div key={file.name} className="flex justify-between items-center py-2">
            {file.isFolder ? (
              <div className="flex items-center gap-2">
                <button className="text-blue-400 hover:underline" onClick={() => setCurrentPath(`${currentPath}/${file.name}`)}>
                  📂 {file.name}
                </button>
                <button className="text-red-400 hover:text-red-300 ml-4" onClick={() => handleDeleteFolder(file.name)}>삭제</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.name)}
                  onChange={() => toggleFileSelection(file.name)}
                />
                {file.url && file.name.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                  <img src={file.url} alt={file.name} className="max-w-64 max-h-64 object-contain rounded-md border border-gray-600" />
                ) : (
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:underline">
                    📄 {file.name}
                  </a>
                )}
                <button className="text-red-400 hover:text-red-300 ml-4" onClick={() => handleDeleteFile(file.name)}>삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 🔹 이동할 폴더 선택 UI */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 p-4 border border-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">📦 이동할 폴더 선택</h2>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {characterNames.map((folder) => (
              <button
                key={folder}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white text-left"
                onClick={() => handleMoveFiles(folder)}
              >
                📁 {folder}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🔹 폴더 추가 */}
      <div className="mt-4 flex gap-2">
        <input type="text" placeholder="새 폴더 이름" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
          className="p-2 bg-gray-700 rounded-md text-white" />
        <button className="px-4 py-2 bg-blue-600 rounded-md" onClick={handleCreateFolder}>폴더 추가</button>
      </div>

      {/* 🔹 파일 업로드 */}
      <div className="mt-4">
        <input type="file" multiple onChange={handleFileUpload} className="text-gray-300" />
      </div>
    </div>
  );
}
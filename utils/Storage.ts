import { storage } from "@/libs/firebaseConfig";
import { ref, listAll, getDownloadURL } from "firebase/storage";

// "경로/경로/" 를 folderPath로 입력시 해당 스토리지 경로 모든 파일 URL 로드
export const fetchImagesFromStorage = async (folderPath: string): Promise<string[]> => {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    return await Promise.all(result.items.map((item) => getDownloadURL(item)));
  } catch (error) {
    console.error("🔥 이미지 불러오기 오류:", error);
    return [];
  }
};

// "경로/"의 모든 폴더를 탐색하고, 각 폴더 내 파일 URL 가져오기
export const fetchGalleryFromStorage = async (basePath: string) => {
  try {
    const storageRef = ref(storage, basePath);
    const folderList = await listAll(storageRef);

    return await Promise.all(
      folderList.prefixes.map(async (folderRef) => {
        const folderName = folderRef.name;
        const imageList = await listAll(folderRef);

        const images = await Promise.all(
          imageList.items.map(async (imageRef) => getDownloadURL(imageRef))
        );

        return { folder: folderName, images };
      })
    );
  } catch (error) {
    console.error("🔥 갤러리 가져오기 오류:", error);
    return [];
  }
};

// 특정 경로(basePath)의 **폴더 목록만** 가져옴 (이미지 URL X)
export const fetchFoldersFromStorage = async (basePath: string): Promise<string[]> => {
 try {
   const storageRef = ref(storage, basePath);
   const folderList = await listAll(storageRef);
   return folderList.prefixes.map((folderRef) => folderRef.name); // 폴더 이름만 반환
 } catch (error) {
   console.error("🔥 폴더 목록 불러오기 오류:", error);
   return [];
 }
};
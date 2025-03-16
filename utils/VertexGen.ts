import { storage, db, vertexAI } from "@/libs/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getImagenModel, ImagenAspectRatio, ImagenSafetyFilterLevel } from "firebase/vertexai";

/**
 * 이미지 생성 및 저장 함수
 * @param prompt 이미지 생성 프롬프트 (최대 500자)
 * @param uid 사용자 UID (로그인 필수)
 * @returns 생성된 이미지 URL
 */
export const generateAndSaveImage = async (prompt: string, uid: string, aspectRatio: ImagenAspectRatio) => {
  try {
    if (!prompt || !uid) throw new Error("Prompt or UID is missing.");
    if (prompt.length > 500) throw new Error("Prompt too long.");

    // 🔥 동적 모델 생성
    const imagenModel = getImagenModel(vertexAI, {
      model: "imagen-3.0-generate-002",
      generationConfig: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        addWatermark: false,
        negativePrompt: "blurry, low quality, bad anatomy, bad hands, bad fingers, extra fingers, missing fingers, deformed hands, fused fingers, poorly drawn face, asymmetrical eyes, cross-eye, bad proportions, extra limbs, watermark, text, logo, signature, grainy, noisy background, low contrast, oversaturated, poorly drawn, bad perspective"
      },
      safetySettings: {
        safetyFilterLevel: ImagenSafetyFilterLevel.BLOCK_NONE,
      },
    });

    const result = await imagenModel.generateImages(prompt);
    if (!result.images || !result.images[0]?.bytesBase64Encoded) {
      throw new Error("No image data returned.");
    }

    const imageBase64 = result.images[0].bytesBase64Encoded;

    // 🔥 Firebase Storage에 업로드
    const storagePath = `generator/${uid}/${Date.now()}.png`;
    const storageRef = ref(storage, storagePath);
    const imageBuffer = Buffer.from(imageBase64, "base64");

    try {
      await uploadBytes(storageRef, imageBuffer, { contentType: "image/png" });
    } catch (err: unknown) {
      console.error("🔥 Upload to Firebase Storage failed:", err);
      throw new Error("Failed to upload image to storage.");
    }

    // 다운로드 URL 가져오기
    let downloadURL: string;
    try {
      downloadURL = await getDownloadURL(storageRef);
    } catch (err: unknown) {
      console.error("🔥 Failed to get download URL:", err);
      throw new Error("Failed to retrieve image URL from storage.");
    }

    // 🔥 Firestore에 메타데이터 저장
    try {
      const docRef = await addDoc(collection(db, "generator"), {
        uid,
        imageUrl: downloadURL,
        prompt,
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        imageUrl: downloadURL,
        imageId: docRef.id,
        message: "Image successfully generated and saved",
      };
    } catch (err: unknown) {
      console.error("🔥 Failed to save metadata to Firestore:", err);
      throw new Error("Failed to save image metadata. Please try again.");
    }
  } catch (error: unknown) {
    // ✅ 타입 가드로 체크
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Unknown error occurred.");
    }
  }
};
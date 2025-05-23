import { storage, db } from "@/libs/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Txt2ImgPayload {
  prompt: string;
  negative_prompt: string;
  steps: number;
  cfg_scale: number;
  width: number;
  height: number;
  sampler_index: string;
  scheduler?: string;
  uid: string;
}

/**
 * Stable Diffusion 이미지 생성 + Firebase Storage 업로드 + Firestore 저장
 */
export async function text2imgSD(payload: Txt2ImgPayload) {
  const {
    prompt,
    uid,
    negative_prompt,
    steps,
    cfg_scale,
    width,
    height,
    sampler_index,
    scheduler,
  } = payload;

  if (!prompt || !uid) throw new Error("Prompt 또는 UID가 누락되었습니다.");

  const requestBody: Partial<Txt2ImgPayload> = {
    prompt,
    negative_prompt,
    steps,
    cfg_scale,
    width,
    height,
    sampler_index,
  };

  if (scheduler) requestBody.scheduler = scheduler;

  const response = await fetch("https://rpavergen.loca.lt/sdapi/v1/txt2img", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`Stable Diffusion 요청 실패: ${raw}`);

  const parsed = JSON.parse(raw);
  if (!parsed.images || !parsed.images[0]) throw new Error("Stable Diffusion 이미지 없음");

  const base64Image = parsed.images[0];
  const imageBuffer = Buffer.from(base64Image, "base64");
  const storagePath = `generator/${uid}/${Date.now()}.png`;
  const storageRef = ref(storage, storagePath);

  try {
    await uploadBytes(storageRef, imageBuffer, { contentType: "image/png" });
  } catch (uploadErr) {
    console.error("🔥 Storage 업로드 실패:", uploadErr);
    throw new Error("Storage 업로드 실패");
  }

  let downloadURL: string;
  try {
    downloadURL = await getDownloadURL(storageRef);
  } catch (urlErr) {
    console.error("🔥 다운로드 URL 실패:", urlErr);
    throw new Error("다운로드 URL 실패");
  }

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
      message: "이미지 생성 및 저장 성공",
    };
  } catch (firestoreErr) {
    console.error("🔥 Firestore 저장 실패:", firestoreErr);
    throw new Error("메타데이터 저장 실패");
  }
}
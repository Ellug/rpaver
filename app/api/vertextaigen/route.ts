import { NextResponse } from "next/server";
import { db, imagenModel, storage } from "@/libs/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { prompt, uid } = await req.json();

    if (!prompt || !uid) {
      return NextResponse.json({ error: "Prompt and UID are required" }, { status: 400 });
    }

    if (prompt.length > 500) {
      return NextResponse.json({ error: "Prompt too long (max 500 characters)" }, { status: 400 });
    }

    // 이미지 생성 요청
    const result = await imagenModel.generateImages(prompt);

    if (!result.images || !result.images[0]?.bytesBase64Encoded) {
      throw new Error("Failed to generate image.");
    }

    const imageBase64 = result.images[0].bytesBase64Encoded;

    // Firebase Storage에 이미지 업로드
    const storageRef = ref(storage, `generator/${uid}/${Date.now()}.png`);
    const imageBuffer = Buffer.from(imageBase64, "base64");
    await uploadBytes(storageRef, imageBuffer, { contentType: "image/png" });

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef);

    // Firestore에 개별 문서로 저장
    const docRef = await addDoc(collection(db, "generator"), {
      uid,
      imageUrl: downloadURL,
      prompt,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      imageUrl: downloadURL,
      imageId: docRef.id,
      message: "Image successfully generated and saved",
    });
  } catch (error: unknown) {
    console.error("Image generation failed:", error);
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
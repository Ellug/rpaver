// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     console.log("요청 내용:", body); // 디버깅 로그 추가

//     const sdResponse = await fetch("https://rpavergen.loca.lt/sdapi/v1/txt2img", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });

//     const raw = await sdResponse.text(); // 강제로 text로 받음
//     console.log("Stable Diffusion 응답 상태:", sdResponse.status);
//     console.log("Stable Diffusion 응답 본문:", raw);

//     if (!sdResponse.ok) {
//       return NextResponse.json({ error: "Stable Diffusion 요청 실패", detail: raw }, { status: 500 });
//     }

//     return NextResponse.json(JSON.parse(raw));
//   } catch (error) {
//     console.error("API 에러:", error);
//     return NextResponse.json({ error: "서버 오류", detail: String(error) }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { storage, db } from "@/libs/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("요청 내용:", body);

    const sdResponse = await fetch("https://rpavergen.loca.lt/sdapi/v1/txt2img", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await sdResponse.text();
    console.log("Stable Diffusion 응답 상태:", sdResponse.status);
    console.log("Stable Diffusion 응답 본문:", raw);

    if (!sdResponse.ok) {
      return NextResponse.json({ error: "Stable Diffusion 요청 실패", detail: raw }, { status: 500 });
    }

    const parsed = JSON.parse(raw);
    if (!parsed.images || !parsed.images[0]) {
      return NextResponse.json({ error: "이미지 데이터 없음" }, { status: 500 });
    }

    const base64Image = parsed.images[0];
    const uid = body.uid ?? "anonymous"; // UID가 요청에 포함되어 있어야 함
    const prompt = body.prompt;
    const imageBuffer = Buffer.from(base64Image, "base64");
    const storagePath = `generator/${uid}/${Date.now()}.png`;
    const storageRef = ref(storage, storagePath);

    try {
      await uploadBytes(storageRef, imageBuffer, { contentType: "image/png" });
    } catch (uploadErr) {
      console.error("🔥 Firebase Storage 업로드 실패:", uploadErr);
      return NextResponse.json({ error: "Storage 업로드 실패" }, { status: 500 });
    }

    let downloadURL;
    try {
      downloadURL = await getDownloadURL(storageRef);
    } catch (urlErr) {
      console.error("🔥 다운로드 URL 실패:", urlErr);
      return NextResponse.json({ error: "Storage URL 가져오기 실패" }, { status: 500 });
    }

    try {
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
        message: "이미지 생성 및 저장 성공",
      });
    } catch (firestoreErr) {
      console.error("🔥 Firestore 저장 실패:", firestoreErr);
      return NextResponse.json({ error: "메타데이터 저장 실패" }, { status: 500 });
    }
  } catch (error) {
    console.error("API 에러:", error);
    return NextResponse.json({ error: "서버 오류", detail: String(error) }, { status: 500 });
  }
}

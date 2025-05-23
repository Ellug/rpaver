import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("요청 내용:", body);

    const { prompt, negative_prompt, uid = "anonymous", ...rest } = body;

    // Firestore에 비동기 요청 문서 생성
    const docRef = await addDoc(collection(db, "generator"), {
      uid,
      prompt,
      negative_prompt,
      status: "pending",
      createdAt: serverTimestamp(),
      options: rest,
    });

    // 이 ID로 클라이언트는 결과를 폴링하거나 실시간 리스닝할 수 있음
    return NextResponse.json({
      success: true,
      message: "생성 요청이 접수되었습니다. 결과는 추후 확인하세요.",
      imageId: docRef.id,
    });
  } catch (error) {
    console.error("API 에러:", error);
    return NextResponse.json({ error: "서버 오류", detail: String(error) }, { status: 500 });
  }
}
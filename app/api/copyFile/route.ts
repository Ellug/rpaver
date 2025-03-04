import { storage } from "@/libs/firebaseAdmin";
import { NextResponse } from "next/server";

const bucket = storage.bucket();

// 🔹 여러 개 파일 이동 API
export async function POST(req: Request) {
  try {
    const { files } = await req.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ success: false, error: "올바른 파일 목록을 입력하세요." }, { status: 400 });
    }

    for (const { oldPath, newPath } of files) {
      const oldFilePath = oldPath.replace(/^\/+/, "");
      const newFilePath = newPath.replace(/^\/+/, "");

      console.log(`📡 파일 복사 요청: ${oldFilePath} → ${newFilePath}`);

      const oldFile = bucket.file(oldFilePath);
      const newFile = bucket.file(newFilePath);

      const [exists] = await oldFile.exists();
      if (exists) {
        await oldFile.copy(newFile);
      } else {
        console.warn(`⚠️ 파일 없음: ${oldFilePath}`);
      }
    }

    return NextResponse.json({ success: true, message: "파일 복사 완료" });
  } catch (error) {
    console.error("🔥 파일 이동 오류:", error);
    return NextResponse.json({ success: false, error: "서버 오류 발생" }, { status: 500 });
  }
}
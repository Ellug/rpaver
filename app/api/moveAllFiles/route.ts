import { NextResponse } from "next/server";
import { storage } from "@/libs/firebaseAdmin";

const bucket = storage.bucket();

// 🔹 특정 폴더 내 모든 파일 이동 API
export async function POST(req: Request) {
  try {
    const { folderPath, targetFolder } = await req.json();

    if (!folderPath || !targetFolder) {
      return NextResponse.json({ success: false, error: "폴더 경로를 입력하세요." }, { status: 400 });
    }

    console.log(`📡 폴더 이동 요청: ${folderPath} → ${targetFolder}`);

    // 🔹 특정 폴더 내 모든 파일 가져오기
    const [files] = await bucket.getFiles({ prefix: folderPath });

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "이동할 파일이 없습니다." }, { status: 404 });
    }

    for (const file of files) {
      const oldPath = file.name;
      const newPath = oldPath.replace(folderPath, targetFolder);

      console.log(`📂 파일 이동: ${oldPath} → ${newPath}`);

      const newFile = bucket.file(newPath);

      // 🔹 파일 복사 후 원본 삭제 (이동)
      await file.copy(newFile);
      await file.delete();
    }

    return NextResponse.json({ success: true, message: "✅ 모든 파일 이동 완료!" });
  } catch (error) {
    console.error("🔥 파일 이동 오류:", error);
    return NextResponse.json({ success: false, error: "서버 오류 발생" }, { status: 500 });
  }
}

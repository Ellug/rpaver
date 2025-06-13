import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/libs/firebaseAdmin";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const { folderPath, folder } = await req.json();

    if (!folderPath || !folder) {
      return NextResponse.json({ success: false, error: "유효한 폴더 경로가 필요합니다." }, { status: 400 });
    }

    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: folderPath });

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "파일이 존재하지 않습니다." }, { status: 404 });
    }

    const zip = new JSZip();

    for (const file of files) {
      const [buffer] = await file.download();
      const filename = file.name.split("/").pop() || "unnamed.jpg";
      zip.file(filename, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(folder)}.zip"`,
      },
    });
  } catch (error) {
    console.error("🔥 ZIP 생성 실패:", error);
    return NextResponse.json({ success: false, error: "ZIP 응답 실패" }, { status: 500 });
  }
}

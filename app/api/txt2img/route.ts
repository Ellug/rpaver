import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 비동기 백엔드 워커에게 요청 보내되 응답은 기다리지 않음
    fetch("https://rpavergen.loca.lt/txt2img", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => {
      console.error("🔥 백엔드 워커 전송 실패:", err);
    });

    return NextResponse.json({
      message: "요청 전송 완료. 결과는 자동으로 처리됩니다.",
    });
  } catch (error) {
    console.error("🔥 API 중계 에러:", error);
    return NextResponse.json(
      { error: "중계 서버 오류", detail: String(error) },
      { status: 500 }
    );
  }
}
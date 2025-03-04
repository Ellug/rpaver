import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY, // 값이 존재하는지 확인
  });
}

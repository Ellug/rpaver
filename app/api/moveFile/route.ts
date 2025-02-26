import { NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";

// 🔹 Firebase Admin SDK 직접 정의
const serviceAccount = {
  type: "service_account",
  project_id: "rp-encyclopedia",
  private_key_id: "47e9309f9d4dd242372f7622df557eb911e42cd5",
  private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDDKnZaZQhsnwQw\nEbRdhSvy26Kb9iOHPW+BHMxtufsA9ty8LtJFpLlFLyv//tS6wTc3PUSyl2Fof0Vv\nYaHnh6lhzNZs2ASIEkNkkhzuwKWWJpLSlW1aP0AM4z3VcCy1ljdDEPTLTyyMfuJX\nstRwsj2+11VVZjAuWVFVGdAE80U9QmjxjFL3aa+MrI1NOapSXkP+lrNMKJEbmTv/\nM+rJipL2Zjl3M0talLTMKT2m3oWDUAd7fAMkPS/veaO0xDZ0wlwzwkHQrRrYey2N\n4fYZkePdxyhiMT7dAiY54Zhjk1dd85JPATR1DgDzXqYla70zKjbmJ0nEBu5/yi6t\nfYci3cxNAgMBAAECggEAJO8bv8af/gJn5frrwckKhKbJEq/VkGnxeKMtEtTf6hJN\nurU3qONgBnZDYupkcsVPAD6xigS48/AmAUqeO7VCOlZr++Qzk1a1d0ppfEtr6sr4\n/S43KB2RLv8wO/zDEUhQw/npAbLFkP8QMZ2Ps5YftkaFCSjSFGtlx2+fnNg28b0T\nh7MZilFZvYFzTqUfXM8ZDKz8/h2XhYNt17SiYB4/UOdauFW/wzucCvnwMLo6AFe9\ncHwiJcmu4sZjc9GvoapIhZ5jSyguM1/VLmhz3hxm9USqGxTDIecFD/+FbiFCDwBj\nY58YUhHMh2ERAXdWnmsiO5LRlQT51J1n8fr3VwcdhwKBgQDiz9jAFAJ8bx4YZrN0\nZ6mI/cWm/9OZMwn1wXFMSG5Cu4v7Egg6eWj8QS3X5axH7T6IEyyrZde4PM5i6t+M\n88C7sHURL6dU12icsavNdzXRFHSrNyMDV1Amq4ZYDHfVV1TDb6c0T3vcs6CX3fXI\n9etkC3LHAZFyuT6RJa0ytRDvEwKBgQDcSA9hR4OkSwOroMzn59PO9Rd7YsmeQIha\nMCCYkJlg6j7y2GBpHCJqmcgxrIvxDuqarg3rGflA6EH1aeuGuhc+nVoyEqwkkd5S\nhPg4P3FCi9HgodD51tT5pF5MH4cVvOGn/rSgRrfEot5sWY5JvUFzxxBsBD2XPI4v\nFTd/SkHjHwKBgQDIvreUAeHVaq/TXwrUK2/VLO8EiQcqYA8fsa/qmWzlqYMSm/om\nbxDpu3Ks1L3wB15CJ95wcTpF+aOdz04/PfrG5D4pEOlkYSdZELQDrdA3FojQhYN6\n0IvDPiswwRBLBfmi5K6z0OnLBD1OTQjebjKCINPcqVmnlad35kXuTG4JewKBgCFj\n0uD+BBhNPpsvXp/wZgzC3fJYARO52HFDRk2Z7YXhO/V3kvWbzCO4d73/156Mkkcs\nBvQSFdQe4JCgo5DieE+HbnqUlf9dFQQRH8b25uYdZ4zTOmgEhnfo0FpdlQ5YeSQL\n2blJvuVRgsGNuaG3zEoObJDS+7sG9M5yOt1SljYlAoGBAKZ9FMG/dz2SluiH3VrX\nLdNcv9w3DuzLZUx1wqyjN4Q9UH+D6WES21pTs4QXcS0PhZpwtFj0KWxCxUscmse4\nWk75C7zssALEkX24npp7QVbGedyX+NpMrkZFEU/6FeS+9iiwHkug6Qb/2svLL4nJ\nY+znJ9mHFMHsNUKfcCERDieb\n-----END PRIVATE KEY-----\n`,
  client_email: "firebase-adminsdk-efo51@rp-encyclopedia.iam.gserviceaccount.com",
  client_id: "102886104294092949767",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-efo51%40rp-encyclopedia.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

// 🔹 Firebase Admin SDK 초기화
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket: "rp-encyclopedia.appspot.com",
  });
}

const bucket = getStorage().bucket();

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

      console.log(`📡 파일 이동 요청: ${oldFilePath} → ${newFilePath}`);

      const oldFile = bucket.file(oldFilePath);
      const newFile = bucket.file(newFilePath);

      const [exists] = await oldFile.exists();
      if (exists) {
        await oldFile.copy(newFile);
        await oldFile.delete();
      } else {
        console.warn(`⚠️ 파일 없음: ${oldFilePath}`);
      }
    }

    return NextResponse.json({ success: true, message: "파일 이동 완료" });
  } catch (error) {
    console.error("🔥 파일 이동 오류:", error);
    return NextResponse.json({ success: false, error: "서버 오류 발생" }, { status: 500 });
  }
}
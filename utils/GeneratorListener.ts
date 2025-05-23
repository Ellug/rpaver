import { useEffect } from "react";
import { onSnapshot, collection, query, where, orderBy, DocumentData } from "firebase/firestore";
import { db } from "@/libs/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";

export const useGeneratorListener = () => {
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, "generator"),
      where("uid", "==", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const added = snapshot.docChanges().find(change => change.type === "added");
      if (added) {
        const data: DocumentData = added.doc.data();
        alert(`✅ 이미지 생성 완료\n프롬프트: ${data.prompt}`);
      }
    });

    return () => unsubscribe();
  }, [userData?.uid]);
};
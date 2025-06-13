export const downloadAlbum = async (folderName: string, imageUrls: string[]) => {
  try {
    const res = await fetch("/api/download-album", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folder: folderName,
        folderPath: `charactersIMG/${folderName}`,
      })
    });

    if (!res.ok) throw new Error("ZIP 응답 실패");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("🔥 다운로드 오류:", e);
    alert("ZIP 다운로드에 실패했습니다.");
  }
};
"use client";

import React from "react";
import EditorHeader from "./EditorHeader";
import EditorBody from "./EditorBody";

interface EditorProps {
  document: HistoryDocType | null;
}

const Editor: React.FC<EditorProps> = ({ document }) => {

  return (
    <div className="h-full flex-1 p-2 text-white">
      {document ? (
        <div className="h-full bg-gray-900 p-4 rounded-md shadow-md">
          <EditorHeader
            documentId={document.id}
            initialTitle={document.title}
            initialDate={document.date}
            createdAt={document.createdAt}
            updatedAt={document.updatedAt}
          />

          <EditorBody documentId={document.id} />
        </div>
      ) : (
        <div className="flex items-center justify-center text-gray-400">
          <p>문서를 선택해주세요.</p>
        </div>
      )}
    </div>
  );
};

export default Editor;

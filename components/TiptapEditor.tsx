"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Heading from "@tiptap/extension-heading";
import { FontSize } from "@/FontSize";

import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  ImageIcon,
  LinkIcon,
  TypeIcon,
  PaletteIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignCenterIcon,
} from "lucide-react";

// **이미지 크기 조절 확장**
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: "50%" },
    };
  },
});

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload: (files: FileList | null, insertImage: (url: string) => void) => void;
}

export default function TiptapEditor({ content, onChange, onImageUpload }: TiptapEditorProps) {
  const [linkURL, setLinkURL] = useState("");
  const [fontSize, setFontSize] = useState("16px");
  const [color, setColor] = useState("#ffffff");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Strike,
      Heading.configure({ levels: [1, 2, 3] }),
      TextStyle,
      Color,
      FontSize,
      ResizableImage,
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // **외부 `content`가 변경될 때 에디터 반영**
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false); // 기존 상태 유지하며 변경
    }
  }, [content, editor]);

  // 에디터 내부에서 이미지 삽입 함수
  const insertImage = (url: string) => {
    editor?.chain().focus().setImage({ src: url }).run();
  };

  // **링크 추가 핸들러**
  const handleAddLink = () => {
    if (!linkURL.trim()) return alert("링크를 입력하세요.");
  
    // http:// 또는 https:// 가 없으면 자동 추가
    const formattedLink = linkURL.startsWith("http") ? linkURL : `https://${linkURL}`;
  
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: formattedLink }) // 링크 추가
      .run();
  
    setLinkURL(""); // 입력값 초기화
  };
  

  const fontSizes = ["8px", "10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px", "56px", "64px"];

  const toolbarButtons = [
    { icon: <BoldIcon className="w-5 h-5 text-white" />, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
    { icon: <ItalicIcon className="w-5 h-5 text-white" />, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
    { icon: <StrikethroughIcon className="w-5 h-5 text-white" />, action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive("strike") },
    { icon: <AlignLeftIcon className="w-5 h-5 text-white" />, action: () => editor?.chain().focus().setTextAlign("left").run(), active: editor?.isActive({ textAlign: "left" }) },
    { icon: <AlignCenterIcon className="w-5 h-5 text-white" />, action: () => editor?.chain().focus().setTextAlign("center").run(), active: editor?.isActive({ textAlign: "center" }) },
    { icon: <AlignRightIcon className="w-5 h-5 text-white" />, action: () => editor?.chain().focus().setTextAlign("right").run(), active: editor?.isActive({ textAlign: "right" }) },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-2 p-2 bg-gray-800 rounded-md flex-wrap">
        {/* 텍스트 스타일 버튼들 */}
        {toolbarButtons.map((btn, index) => (
          <button
            key={index}
            onClick={btn.action}
            className={`p-2 bg-gray-700 hover:bg-gray-600 rounded ${btn.active ? "bg-blue-600" : ""}`}
          >
            {btn.icon}
          </button>
        ))}

        {/* 폰트 크기 드롭다운 */}
        <div className="relative bg-gray-700 px-2 py-1 rounded flex items-center">
          <TypeIcon className="w-5 h-5 text-white" />
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              editor?.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run();
            }}
            className="bg-gray-700 text-white text-sm border-none outline-none px-2 cursor-pointer appearance-none"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* 폰트 색상 조절 */}
        <div className="flex items-center gap-1 bg-gray-700 px-2 rounded">
          <PaletteIcon className="w-5 h-5 text-white" />
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              editor?.chain().focus().setColor(e.target.value).run();
            }}
            className="w-8 h-8 bg-gray-700 border-none outline-none cursor-pointer"
          />
        </div>

        {/* 이미지 추가 */}
        <label className="cursor-pointer p-2 bg-gray-700 hover:bg-gray-600 rounded">
          <ImageIcon className="w-5 h-5 text-white" />
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onImageUpload(e.target.files, insertImage)} />
        </label>

        {/* 링크 추가 */}
        <div className="flex items-center gap-1 bg-gray-700 px-2 rounded">
          <LinkIcon className="w-5 h-5 text-white" />
          <input
            type="text"
            placeholder="링크"
            value={linkURL}
            onChange={(e) => setLinkURL(e.target.value)}
            className="w-32 bg-gray-700 text-white text-sm border-none outline-none px-1"
          />
          <button onClick={handleAddLink} className="px-2 py-1 text-white bg-blue-600 hover:bg-blue-500 rounded text-sm">
            추가
          </button>
        </div>
      </div>

      <EditorContent
        editor={editor}
        onClick={() => editor?.commands.focus()}
        className="text-white min-h-[300px] bg-gray-800 p-4 rounded-md"
      />
    </div>
  );
}
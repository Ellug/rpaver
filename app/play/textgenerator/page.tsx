"use client";

import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useRef, useState } from "react";

interface Txt2ImgPayload {
  prompt: string;
  negative_prompt: string;
  steps: number;
  cfg_scale: number;
  width: number;
  height: number;
  sampler_index: string;
  scheduler?: string;
}

const initialPrompt = "masterpiece, best quality, amazing quality, ultra-detailed, absurdres, extremely detailed CG unity 8k wallpaper, (photorealistic:1.2), sharp focus, professional lighting, cinematic light, beautiful face, (symmetrical face:1.2), perfect anatomy, (flawless skin:1.2), highly detailed eyes, (sparkling blue eyes:1.3), glossy eyes, eye light reflection, ambient occlusion around eyes, (close-up face:1.3), realistic skin texture, subsurface scattering, smooth shading, detailed lips, parted lips, slightly smiling expression, natural expression, Navia from Genshin Impact, no hat, long blonde hair, soft light on face, rim light, backlit, (dappled sunlight:1.2), forest background, volumetric lighting, huge breasts, puffy sleeve white dress, shiny skin, depth of field, vignetting, cinematic bokeh, leaning side against tree, scenery, flowers, white butterfly, vines, green"
const initialNegativePrompt = "(worst quality, low quality, bad quality:1.2), jpeg artifacts, sketch, blurred, text, signature, watermark, username, mutated, deformed, ugly, disfigured, bad anatomy, long body, bad proportions, conjoined, bad ai-generated, bad hands, missing fingers, extra fingers, extra digits, fewer digits, cropped, simple background, (censored:1.2), (bad face, deformed face, disfigured face, poorly drawn face:1.4), (asymmetrical eyes, weird eyes, bad eyes:1.3), (blurred face, extra face, multiple faces, missing facial features:1.3)"

export default function StableTextGenPage() {
  const { userData } = useAuth();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState(initialNegativePrompt);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sampler, setSampler] = useState("DPM++ 2S a");
  const [useKarras, setUseKarras] = useState(false);
  const [cfgScale, setCfgScale] = useState(5);
  const [width, setWidth] = useState(1216);
  const [height, setHeight] = useState(1216);
  const [steps, setSteps] = useState(50);
  const generatedImageRef = useRef<HTMLImageElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("프롬프트를 입력하세요!");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const requestBody: Txt2ImgPayload & { uid: string } = {
        prompt,
        negative_prompt: negativePrompt,
        steps,
        cfg_scale: cfgScale,
        width,
        height,
        sampler_index: sampler,
        uid: userData?.uid || "anonymous",
        ...(useKarras &&
        ["DPM++ 2M SDE", "DPM++ 2S a", "DPM++ 3M SDE"].includes(sampler)
          ? { scheduler: "Karras" }
          : { scheduler: "Automatic" }),
      };

      const response = await fetch("/api/txt2img", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data) {
        alert("이미지 생성 요청. 생성이 완료되면 알람 드립니다.");
      }
    } catch (error) {
      console.error("이미지 생성 실패:", error);
      alert("이미지 생성 중 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (generatedImage && generatedImageRef.current) {
      generatedImageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [generatedImage]);


  const sliders = [
    {
      label: "CFG Scale",
      value: cfgScale,
      min: 1,
      max: 20,
      step: 0.1,
      setValue: (v: number) => setCfgScale(v),
      unit: "",
    },
    {
      label: "Sampling Steps",
      value: steps,
      min: 10,
      max: 150,
      step: 1,
      setValue: (v: number) => setSteps(v),
      unit: "",
    },
    {
      label: "Width",
      value: width,
      min: 512,
      max: 1214,
      step: 64,
      setValue: (v: number) => setWidth(v),
      unit: "px",
    },
    {
      label: "Height",
      value: height,
      min: 512,
      max: 1214,
      step: 64,
      setValue: (v: number) => setHeight(v),
      unit: "px",
    },
  ];

  const samplers = [
    { name: "Euler", desc: "빠르고 안정적인 기본 샘플러" },
    { name: "Euler A", desc: "창의적이고 다양성 높은 결과 생성" },
    { name: "DPM++ 2M SDE", desc: "고품질 정밀 묘사에 최적화" },
    { name: "DPM++ 2S a", desc: "애니/캐릭터 중심 스타일에 강함" },
    { name: "DPM++ 3M SDE", desc: "극한의 리얼리즘과 디테일 표현 가능" },
  ];

  return (
    <div className="bg-black min-h-screen flex flex-col items-center p-6">
      {loading && <div className="text-white mb-4 animate-pulse">Generating...</div>}

      <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Stable Diffusion TextGenerator
      </h1>

      <div className="w-full max-w-6xl flex flex-col gap-4">
        <div>
          <p className="text-xl font-bold">Prompt</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full p-3 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
          />
        </div>
        <div>
          <p className="text-xl font-bold">Negative Prompt</p>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Negative prompt (optional)"
            className="w-full p-3 rounded-md bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sliders.map(({ label, value, min, max, step, setValue, unit }) => (
            <div key={label}>
              <p className="text-sm text-white">
                {label}: {value}
                {unit}
              </p>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div>
          <p className="text-xl font-bold mb-4">Sampler</p>
          <div className="flex flex-col gap-3">
            {samplers.map(({ name, desc }) => (
              <div key={name} className="flex items-start gap-4">
                <input
                  type="radio"
                  id={name}
                  name="sampler"
                  checked={sampler === name}
                  onChange={() => setSampler(name)}
                />
                <div className="flex gap-4">
                  <label htmlFor={name} className="text-white font-semibold">
                    {name}
                  </label>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {["DPM++ 2M SDE", "DPM++ 2S a", "DPM++ 3M SDE"].includes(sampler) && (
            <label className="mt-3 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={useKarras}
                onChange={() => setUseKarras(!useKarras)}
              />
              <span className="text-white">Use Karras scheduler</span>
            </label>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-80 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-md hover:opacity-90 transition"
        >
          {loading ? "Generating..." : "이미지 생성하기"}
        </button>
      </div>

      {generatedImage && (
        <div className="mt-10">
          <img
            ref={generatedImageRef}
            src={generatedImage}
            alt="Generated"
            className="object-contain border border-gray-700 rounded-md"
          />
        </div>
      )}
    </div>
  );
}
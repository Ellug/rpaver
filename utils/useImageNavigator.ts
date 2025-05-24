import { useState } from "react";

export function useImageNavigator<T>(groups: T[][]) {
  const [groupIndex, setGroupIndex] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState<number | null>(null);

  const selectedItem = groupIndex !== null && imageIndex !== null
    ? groups[groupIndex]?.[imageIndex] ?? null
    : null;

  const open = (gIndex: number, iIndex: number) => {
    setGroupIndex(gIndex);
    setImageIndex(iIndex);
  };

  const close = () => {
    setGroupIndex(null);
    setImageIndex(null);
  };

  const next = () => {
    if (groupIndex === null || imageIndex === null) return;
    const images = groups[groupIndex];
    const nextIndex = (imageIndex + 1) % images.length;
    setImageIndex(nextIndex);
  };

  const prev = () => {
    if (groupIndex === null || imageIndex === null) return;
    const images = groups[groupIndex];
    const prevIndex = (imageIndex - 1 + images.length) % images.length;
    setImageIndex(prevIndex);
  };

  return {
    selectedItem,
    groupIndex,
    imageIndex,
    open,
    close,
    next,
    prev,
  };
}

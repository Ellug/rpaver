import { useEffect, useRef, useState } from "react";

const createRenderQueue = (length: number): number[] => {
  const result: number[] = [];
  let left = 0;
  let right = length - 1;

  while (left <= right) {
    if (left === right) {
      result.push(left);
    } else {
      result.push(left);
      result.push(right);
    }
    left++;
    right--;
  }

  return result;
};

export function useImageRenderQueue(length: number) {
  const [renderedIndexes, setRenderedIndexes] = useState<Set<number>>(new Set());
  const renderQueueRef = useRef<number[]>([]);
  const renderIndexRef = useRef(0);

  useEffect(() => {
    if (length === 0) return;

    renderQueueRef.current = createRenderQueue(length);
    renderIndexRef.current = 0;

    const firstIndex = renderQueueRef.current[0];
    setRenderedIndexes(new Set([firstIndex]));
  }, [length]);

  const handleImageLoad = (index: number) => {
    console.log(`✅ img${index} loaded`);
    const nextIndex = renderIndexRef.current + 1;
    const queue = renderQueueRef.current;

    if (nextIndex < queue.length) {
      const nextToRender = queue[nextIndex];
      setRenderedIndexes(prev => {
        const newSet = new Set(prev);
        newSet.add(nextToRender);
        return newSet;
      });
      renderIndexRef.current = nextIndex;
    }
  };

  const handleImageError = () => {
    const queue = renderQueueRef.current;
    const next = queue[renderIndexRef.current + 1];
    if (next !== undefined) {
      renderIndexRef.current++;
      setRenderedIndexes(prev => new Set(prev).add(next));
    }
  };

  return {
    renderedIndexes,
    handleImageLoad,
    handleImageError,
  };
}
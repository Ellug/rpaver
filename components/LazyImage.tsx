import React, { useEffect, useRef, useState } from "react";

type LazyImageProps = {
  src: string;
  alt: string;
  onClick: () => void;
  onLoad?: () => void;
};

const LazyImage = ({ src, alt, onClick, onLoad }: LazyImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const ImageSkeleton = () => (
    <div className="w-full aspect-[3/4] bg-gray-800 animate-pulse rounded-md" />
  );

  return (
    <div ref={imgRef} className="content w-full cursor-pointer">
      {!loaded && <ImageSkeleton />}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onClick={onClick}
          onLoad={() => {
            setLoaded(true);
            onLoad?.();
          }}
          className={`w-full rounded-md transition-transform duration-200 hover:scale-[1.02] ${loaded ? "" : "hidden"}`}
        />
      )}
    </div>
  );
};

export default LazyImage;

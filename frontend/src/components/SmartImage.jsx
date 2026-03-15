import { useState } from "react";

const DEFAULT_FALLBACK = "/logo.png";

export default function SmartImage({ src, alt, fallbackSrc = DEFAULT_FALLBACK, ...props }) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  return (
    <img
      {...props}
      src={currentSrc || fallbackSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

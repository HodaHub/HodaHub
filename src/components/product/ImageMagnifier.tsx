import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  zoomLevel?: number;
  layoutId?: string;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt,
  zoomLevel = 2.2,
  layoutId,
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [[x, y], setXY] = useState([0, 0]);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseEnter = () => {
    setShowMagnifier(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const elem = imgRef.current;
    if (!elem) return;
    const { top, left, width, height } = elem.getBoundingClientRect();
    const xPos = ((e.clientX - left) / width) * 100;
    const yPos = ((e.clientY - top) / height) * 100;
    setXY([Math.max(0, Math.min(100, xPos)), Math.max(0, Math.min(100, yPos))]);
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  return (
    <div
      className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden cursor-crosshair border border-slate-200/90 flex items-center justify-center p-6 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.img
        layoutId={layoutId}
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-200"
      />

      {/* Floating Magnified Preview overlay on hover */}
      {showMagnifier && (
        <div
          className="absolute inset-0 z-20 pointer-events-none rounded-xl overflow-hidden bg-white shadow-2xl border-2 border-primary-500"
          style={{
            backgroundImage: `url('${src}')`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `${x}% ${y}%`,
            backgroundSize: `${zoomLevel * 100}%`,
          }}
        >
          <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
            Zoomed {zoomLevel}x
          </div>
        </div>
      )}
    </div>
  );
};

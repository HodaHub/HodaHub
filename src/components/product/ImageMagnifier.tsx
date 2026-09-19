import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, X, Move, Sparkles } from 'lucide-react';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  zoomLevel?: number;
  layoutId?: string;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt,
  zoomLevel = 2.5,
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoomLevel);
  const [[x, y], setXY] = useState([50, 50]);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset coordinates whenever image changes
  useEffect(() => {
    setXY([50, 50]);
    setShowMagnifier(false);
    setIsTouchActive(false);
  }, [src]);

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const { top, left, width, height } = container.getBoundingClientRect();
    const xPos = ((e.clientX - left) / width) * 100;
    const yPos = ((e.clientY - top) / height) * 100;
    setXY([Math.max(0, Math.min(100, xPos)), Math.max(0, Math.min(100, yPos))]);
    if (!showMagnifier) setShowMagnifier(true);
  };

  // Handle Touch Move (Mobile / Tablet / Touchscreen devices)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const container = containerRef.current;
    if (!container) return;
    const { top, left, width, height } = container.getBoundingClientRect();
    const xPos = ((touch.clientX - left) / width) * 100;
    const yPos = ((touch.clientY - top) / height) * 100;
    setXY([Math.max(0, Math.min(100, xPos)), Math.max(0, Math.min(100, yPos))]);
    setIsTouchActive(true);
    setShowMagnifier(true);
  };

  const handleTouchEnd = () => {
    // Keep zoomed for a brief moment or allow tap to toggle
    setTimeout(() => {
      setIsTouchActive(false);
      setShowMagnifier(false);
    }, 1200);
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentZoom((prev) => (prev >= 3.5 ? 2 : prev + 0.75));
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden cursor-crosshair border border-slate-200/90 flex items-center justify-center p-4 sm:p-6 select-none shadow-sm group touch-none"
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowMagnifier(false)}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          key={src}
          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300"
        />

        {/* Floating Magnified Preview overlay on hover or touch */}
        {showMagnifier && (
          <div
            className="absolute inset-0 z-20 pointer-events-none rounded-2xl overflow-hidden bg-white shadow-2xl border-2 border-primary-500"
            style={{
              backgroundImage: `url("${src}")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${x}% ${y}%`,
              backgroundSize: `${currentZoom * 100}%`,
            }}
          >
            {/* Top-Right Info Badge */}
            <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-[11px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 shadow-md border border-slate-700">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Zoom {currentZoom.toFixed(1)}x</span>
            </div>

            {/* Bottom-Center Position Hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[10px] font-medium px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow">
              <Move className="w-3 h-3 text-primary-400" />
              <span>{isTouchActive ? 'Drag to explore' : 'Move cursor to inspect'}</span>
            </div>
          </div>
        )}

        {/* Action Controls Bar (Bottom left: Zoom mode toggle & Fullscreen trigger) */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleZoom}
            className="p-1.5 sm:p-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-primary-600 shadow-md border border-slate-200/80 backdrop-blur-xs flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            title={`Toggle zoom level (currently ${currentZoom.toFixed(1)}x)`}
          >
            <ZoomIn className="w-3.5 h-3.5 text-primary-600" />
            <span className="font-mono">{currentZoom.toFixed(1)}x</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreenModal(true);
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-primary-600 shadow-md border border-slate-200/80 backdrop-blur-xs flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            title="Open full-screen inspection view"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Inspect</span>
          </button>
        </div>

        {/* Subtle hover/touch hint when not zoomed */}
        {!showMagnifier && (
          <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
            <ZoomIn className="w-3 h-3 text-white/80" />
            <span>Hover or touch to zoom</span>
          </div>
        )}
      </div>

      {/* FULLSCREEN HIGH-RES INSPECTION MODAL */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-in fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-white pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-primary-400" />
              <h4 className="text-sm font-bold truncate max-w-md">{alt}</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentZoom((prev) => Math.max(1.5, prev - 0.5))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-300 font-bold">
                {currentZoom.toFixed(1)}x
              </span>
              <button
                type="button"
                onClick={() => setCurrentZoom((prev) => Math.min(5, prev + 0.5))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowFullscreenModal(false)}
                className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors ml-2 cursor-pointer"
                title="Close inspection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Inspection Canvas */}
          <div
            className="flex-1 relative overflow-hidden flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            <div
              className="w-full h-full rounded-xl"
              style={{
                backgroundImage: `url("${src}")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `${x}% ${y}%`,
                backgroundSize: `${currentZoom * 120}%`,
              }}
            />
          </div>

          {/* Inspection Footer Instructions */}
          <div className="text-center text-xs text-slate-400 pt-2 font-medium">
            Drag with mouse or finger to pan across high-resolution product details
          </div>
        </div>
      )}
    </>
  );
};

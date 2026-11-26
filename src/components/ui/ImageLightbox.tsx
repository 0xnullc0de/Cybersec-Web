'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.4;

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const lastTouchDist = useRef<number | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Clamp offset so image never drifts too far out of view
  const clampOffset = useCallback((z: number, ox: number, oy: number) => {
    // Allow panning proportional to how much we've zoomed
    const maxX = Math.max(0, (z - 1) * 400);
    const maxY = Math.max(0, (z - 1) * 300);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, []);

  // Scroll-wheel zoom centred on cursor
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => {
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Double-click to zoom in / reset
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => {
      if (prev > 1) {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
      return 2.5;
    });
  }, []);

  // Mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [zoom, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const clamped = clampOffset(zoom, dragStart.current.ox + dx, dragStart.current.oy + dy);
    setOffset(clamped);
  }, [isDragging, zoom, clampOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // Touch pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / lastTouchDist.current;
      lastTouchDist.current = dist;
      setZoom(prev => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * scale));
        if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  const zoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, +(prev + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => {
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, +(prev - ZOOM_STEP).toFixed(2));
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  };
  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
    >
      {/* Top toolbar */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0d1117]/90 border border-[#1b2631] rounded-xl px-3 py-1.5 z-10 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="p-1.5 rounded-lg hover:bg-[#1b2631] text-gray-400 hover:text-white disabled:opacity-30 transition-all"
          title="Zoom out (scroll wheel also works)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-[#00ff66] min-w-[3.5rem] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="p-1.5 rounded-lg hover:bg-[#1b2631] text-gray-400 hover:text-white disabled:opacity-30 transition-all"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[#1b2631]" />

        <button
          onClick={reset}
          disabled={zoom === 1}
          className="p-1.5 rounded-lg hover:bg-[#1b2631] text-gray-400 hover:text-white disabled:opacity-30 transition-all"
          title="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[#1b2631]" />

        <span className="text-[10px] text-gray-500 font-mono hidden sm:block">
          scroll / pinch to zoom • drag to pan
        </span>
      </div>

      {/* Close button */}
      <button
        className="absolute top-4 right-4 p-2 rounded-xl bg-[#0d1117]/90 border border-[#1b2631] text-gray-400 hover:text-white hover:bg-[#1b2631] transition-all z-10"
        onClick={onClose}
        title="Close (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image container */}
      <div
        ref={imgRef}
        className="relative max-w-[90vw] max-h-[85vh] select-none"
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-[90vw] max-h-[85vh] rounded-xl border border-[#1b2631] shadow-2xl object-contain"
          style={{
            transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease',
            transformOrigin: 'center center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      </div>

      {/* Alt text / caption at bottom */}
      {alt && alt !== 'Screenshot' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-lg text-center text-xs font-mono text-gray-400 bg-[#0d1117]/80 border border-[#1b2631] rounded-lg px-4 py-2 backdrop-blur-sm">
          {alt}
        </div>
      )}

      {/* Zoom hint on first open */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 font-mono pointer-events-none sm:hidden">
        double-tap to zoom • pinch to scale
      </div>
    </div>
  );
}

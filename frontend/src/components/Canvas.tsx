import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { pixelApi } from '../services/api';
import { isApiError } from '../utils/typeGuards';

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [initialized, setInitialized] = useState(false);

  const getMinZoom = () => {
    return Math.max(
      window.innerWidth / CANVAS_WIDTH,
      window.innerHeight / CANVAS_HEIGHT
    );
  };

  const constrainOffset = (x: number, y: number, currentZoom: number) => {
    const canvasWidth = CANVAS_WIDTH * currentZoom;
    const canvasHeight = CANVAS_HEIGHT * currentZoom;

    let newX = x;
    let newY = y;

    if (canvasWidth > window.innerWidth) {
      newX = Math.min(0, Math.max(window.innerWidth - canvasWidth, x));
    } else {
      newX = (window.innerWidth - canvasWidth) / 2;
    }

    if (canvasHeight > window.innerHeight) {
      newY = Math.min(0, Math.max(window.innerHeight - canvasHeight, y));
    } else {
      newY = (window.innerHeight - canvasHeight) / 2;
    }

    return { x: newX, y: newY };
  };

  const pixels = useStore((state) => state.pixels);
  const selectedColor = useStore((state) => state.selectedColor);
  const zoom = useStore((state) => state.zoom);
  const offset = useStore((state) => state.offset);
  const isPreviewMode = useStore((state) => state.isPreviewMode);
  const canvasMode = useStore((state) => state.canvasMode);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const setZoom = useStore((state) => state.setZoom);
  const setOffset = useStore((state) => state.setOffset);
  const setPixel = useStore((state) => state.setPixel);
  const cooldown = useStore((state) => state.cooldown);
  const isPlacing = useStore((state) => state.isPlacing);
  const setIsPlacing = useStore((state) => state.setIsPlacing);
  const setCooldown = useStore((state) => state.setCooldown);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    if (isPreviewMode) {
      const scale = Math.min(
        (canvas.width * 0.8) / CANVAS_WIDTH,
        (canvas.height * 0.8) / CANVAS_HEIGHT
      );
      const centerX = (canvas.width - CANVAS_WIDTH * scale) / 2;
      const centerY = (canvas.height - CANVAS_HEIGHT * scale) / 2;

      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
    } else {
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    pixels.forEach((color, key) => {
      const parts = key.split(',').map(Number);
      const x = parts[0];
      const y = parts[1];
      if (x !== undefined && y !== undefined) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });

    if (hoveredPixel && !isPreviewMode) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.1;
      ctx.strokeRect(hoveredPixel.x, hoveredPixel.y, 1, 1);
    }

    ctx.restore();
  }, [pixels, zoom, offset, hoveredPixel, isPreviewMode]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (!initialized) {
        const scale = getMinZoom();
        setZoom(scale);
        setOffset(0, 0);
        setInitialized(true);
      }

      drawCanvas();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [initialized, drawCanvas, setZoom, setOffset]);

  useEffect(() => {
    drawCanvas();
  }, [pixels, zoom, offset, hoveredPixel, isPreviewMode, drawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (isPreviewMode) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = zoom * delta;
      const minZoom = getMinZoom();
      const constrainedZoom = Math.max(minZoom, Math.min(10, newZoom));
      const newOffset = constrainOffset(offset.x, offset.y, constrainedZoom);
      setZoom(constrainedZoom);
      setOffset(newOffset.x, newOffset.y);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, offset, setZoom, setOffset, isPreviewMode]);

  const screenToCanvas = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - offset.x) / zoom;
    const y = (screenY - rect.top - offset.y) / zoom;

    return {
      x: Math.floor(Math.max(0, Math.min(CANVAS_WIDTH - 1, x))),
      y: Math.floor(Math.max(0, Math.min(CANVAS_HEIGHT - 1, y))),
    };
  };

  const handleClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAuthenticated) return;
    if (isPreviewMode) return;
    if (canvasMode !== 'paint') return;
    if (isDragging) return;
    if (cooldown > 0) return;
    if (isPlacing) return;

    const pos = screenToCanvas(e.clientX, e.clientY);

    setIsPlacing(true);

    const response = await pixelApi.place({
      x: pos.x,
      y: pos.y,
      color: selectedColor,
    });

    setIsPlacing(false);

    if (isApiError(response)) {
      alert(response.error);
      return;
    }

    setPixel(pos.x, pos.y, selectedColor);
    if (response.cooldown.active) {
      setCooldown(response.cooldown.remainingSeconds);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPreviewMode) return;
    if (canvasMode === 'move' && e.button === 0) {
      setIsDragging(true);
      setLastPos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      setIsDragging(true);
      setLastPos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPreviewMode) return;
    if (isDragging) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      const newOffset = constrainOffset(offset.x + dx, offset.y + dy, zoom);
      setOffset(newOffset.x, newOffset.y);
      setLastPos({ x: e.clientX, y: e.clientY });
    } else {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setHoveredPixel(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredPixel(null);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
        className="fixed inset-0 bg-gray-900"
        style={{
          cursor: isPreviewMode
            ? 'default'
            : canvasMode === 'move'
            ? isDragging ? 'grabbing' : 'grab'
            : isDragging ? 'grabbing' : cooldown > 0 ? 'not-allowed' : 'crosshair'
        }}
      />
      {hoveredPixel && !isPreviewMode && (
        <div className="fixed top-2 right-2 bg-black/80 text-white px-2 py-1 border border-white font-mono text-xs backdrop-blur-sm">
          ({hoveredPixel.x}, {hoveredPixel.y})
        </div>
      )}
    </>
  );
};

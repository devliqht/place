import { ZoomIn, ZoomOut, RotateCcw, LogOut, Eye, EyeOff, Hand, Paintbrush, Shield, Grid, Tag, Info } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '../store';
import { PALETTE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

export const Toolbar = () => {
  const user = useStore((state) => state.user);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const logout = useStore((state) => state.logout);
  const zoom = useStore((state) => state.zoom);
  const offset = useStore((state) => state.offset);
  const setZoom = useStore((state) => state.setZoom);
  const setOffset = useStore((state) => state.setOffset);
  const selectedColor = useStore((state) => state.selectedColor);
  const setSelectedColor = useStore((state) => state.setSelectedColor);
  const cooldown = useStore((state) => state.cooldown);
  const setCooldown = useStore((state) => state.setCooldown);
  const isPreviewMode = useStore((state) => state.isPreviewMode);
  const setIsPreviewMode = useStore((state) => state.setIsPreviewMode);
  const canvasMode = useStore((state) => state.canvasMode);
  const setCanvasMode = useStore((state) => state.setCanvasMode);
  const showAdminPanel = useStore((state) => state.showAdminPanel);
  const setShowAdminPanel = useStore((state) => state.setShowAdminPanel);
  const showGrid = useStore((state) => state.showGrid);
  const setShowGrid = useStore((state) => state.setShowGrid);
  const showPixelLabels = useStore((state) => state.showPixelLabels);
  const setShowPixelLabels = useStore((state) => state.setShowPixelLabels);
  const setShowInfoModal = useStore((state) => state.setShowInfoModal);

  const isAdmin = user?.isAdmin || false;

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

  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown(Math.max(0, cooldown - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, setCooldown]);


  const handleZoomIn = () => {
    const newZoom = Math.min(50, zoom * 1.2);
    const constrained = constrainOffset(offset.x, offset.y, newZoom);
    setZoom(newZoom);
    setOffset(constrained.x, constrained.y);
  };

  const handleZoomOut = () => {
    const minZoom = getMinZoom();
    const newZoom = Math.max(minZoom, zoom * 0.9);
    const constrained = constrainOffset(offset.x, offset.y, newZoom);
    setZoom(newZoom);
    setOffset(constrained.x, constrained.y);
  };

  const handleReset = () => {
    const scale = Math.max(
      window.innerWidth / CANVAS_WIDTH,
      window.innerHeight / CANVAS_HEIGHT
    );
    setZoom(scale);
    setOffset(0, 0);
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        setCanvasMode('move');
      } else if (e.key === 'p' || e.key === 'P') {
        setCanvasMode('paint');
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleZoomIn, handleZoomOut, handleReset, setCanvasMode]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm border-2 border-white px-3 py-2 shadow-2xl">
      {!isAuthenticated && (
        <div className="absolute inset-0 bg-gray-500/60 pointer-events-none" />
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`w-6 h-6 transition-colors flex items-center justify-center text-white ${
                showAdminPanel ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'
              }`}
              title="Admin Panel"
            >
              <Shield size={14} />
            </button>
          )}
          <button
            onClick={() => setCanvasMode('move')}
            className={`w-6 h-6 transition-colors flex items-center justify-center text-white ${
              canvasMode === 'move' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Move Mode (M)"
          >
            <Hand size={14} />
          </button>
          <button
            onClick={() => setCanvasMode('paint')}
            className={`w-6 h-6 transition-colors flex items-center justify-center text-white ${
              canvasMode === 'paint' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Paint Mode (P)"
          >
            <Paintbrush size={14} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        <div className="flex gap-1">
          {PALETTE.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 border transition-transform hover:scale-125 ${
                selectedColor === color
                  ? 'border-white scale-110'
                  : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              title={color}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-600" />

        <div className="flex items-center gap-1">
          <button
            onClick={togglePreview}
            className={`w-6 h-6 transition-colors flex items-center justify-center text-white ${
              isPreviewMode ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isPreviewMode ? 'Exit Preview' : 'Preview'}
          >
            {isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-6 h-6 transition-colors flex items-center justify-center text-white ${
              showGrid ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={showGrid ? 'Hide Grid' : 'Show Grid'}
          >
            <Grid size={14} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowPixelLabels(!showPixelLabels)}
              className={`w-6 h-6 transition-colors flex items-center justify-center text-white ${
                showPixelLabels ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={showPixelLabels ? 'Hide Pixel Labels' : 'Show Pixel Labels'}
            >
              <Tag size={14} />
            </button>
          )}
          <button
            onClick={handleZoomOut}
            className="w-6 h-6 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
            title="Zoom Out (-)"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-white text-xs font-mono min-w-[2.5rem] text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-6 h-6 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
            title="Zoom In (+)"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleReset}
            className="w-6 h-6 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
            title="Reset (0)"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {isAuthenticated && (
          <>
            <div className="w-px h-6 bg-gray-600" />

            <div className="text-white text-xs font-mono">
              {user?.email}
            </div>

            <button
              onClick={() => setShowInfoModal(true)}
              className="w-6 h-6 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              title="Information"
            >
              <Info size={14} />
            </button>

            <button
              onClick={logout}
              className="w-6 h-6 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>

      {cooldown > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="w-full h-1 bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${(cooldown / 10) * 100}%` }}
            />
          </div>
          <div className="text-white text-xs text-center mt-1 font-mono">
            {cooldown}s
          </div>
        </div>
      )}
    </div>
  );
};

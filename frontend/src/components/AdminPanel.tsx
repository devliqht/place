import { useEffect, useState, useCallback } from 'react';
import { X, Trash2, Undo2, Users } from 'lucide-react';
import { useStore } from '../store';
import { adminApi } from '../services/api';
import { socketService } from '../services/socket';
import { RecentPixel } from '../types';

export const AdminPanel = () => {
  const showAdminPanel = useStore((state) => state.showAdminPanel);
  const setShowAdminPanel = useStore((state) => state.setShowAdminPanel);
  const activeUsers = useStore((state) => state.activeUsers);

  const [recentPixels, setRecentPixels] = useState<RecentPixel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteEmail, setDeleteEmail] = useState('');

  const fetchRecentPixels = useCallback(async () => {
    const result = await adminApi.getRecentPixels(50);
    if ('success' in result && result.success) {
      setRecentPixels(result.pixels);
      setError(null);
    } else {
      setError('error' in result ? result.error : 'Failed to fetch pixels');
    }
  }, []);

  useEffect(() => {
    if (showAdminPanel) {
      fetchRecentPixels();
      const interval = setInterval(fetchRecentPixels, 5000);
      return () => clearInterval(interval);
    }
  }, [showAdminPanel, fetchRecentPixels]);

  useEffect(() => {
    if (!showAdminPanel) return;

    const handlePixelUpdate = (data: unknown) => {
      const pixelData = data as { x: number; y: number; color: string; email?: string };
      if (pixelData.email) {
        const newPixel: RecentPixel = {
          x: pixelData.x,
          y: pixelData.y,
          color: pixelData.color,
          email: pixelData.email,
          placedAt: new Date().toISOString(),
        };
        setRecentPixels(prev => [newPixel, ...prev.slice(0, 49)]);
      }
    };

    const handleCanvasReload = () => {
      fetchRecentPixels();
    };

    socketService.on('pixel-update', handlePixelUpdate);
    socketService.on('canvas-reload', handleCanvasReload);

    return () => {
      socketService.off('pixel-update', handlePixelUpdate);
      socketService.off('canvas-reload', handleCanvasReload);
    };
  }, [showAdminPanel, fetchRecentPixels]);

  const handleRevertPixel = async (x: number, y: number) => {
    if (!confirm(`Revert pixel at (${x}, ${y})?`)) return;

    setLoading(true);
    const result = await adminApi.revertPixel(x, y);
    setLoading(false);

    if ('success' in result && result.success) {
      await fetchRecentPixels();
    } else {
      alert('error' in result ? result.error : 'Failed to revert pixel');
    }
  };

  const handleDeleteUserPixels = async () => {
    if (!deleteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    if (!confirm(`Delete ALL pixels from ${deleteEmail}? This cannot be undone!`)) return;

    setLoading(true);
    const result = await adminApi.deleteUserPixels(deleteEmail);
    setLoading(false);

    if ('success' in result && result.success) {
      alert(`Deleted ${result.deletedCount} pixels from ${deleteEmail}`);
      setDeleteEmail('');
      await fetchRecentPixels();
    } else {
      alert('error' in result ? result.error : 'Failed to delete user pixels');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!showAdminPanel) return null;

  return (
    <div className="fixed top-4 right-4 w-96 bg-black/95 backdrop-blur-sm border-2 border-white text-white shadow-2xl max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <h2 className="text-sm font-bold">ADMIN PANEL</h2>
        <button
          onClick={() => setShowAdminPanel(false)}
          className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          title="Close"
        >
          <X size={12} />
        </button>
      </div>

      <div className="p-3 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span className="text-xs font-mono">
            {activeUsers} user{activeUsers !== 1 ? 's' : ''} online
          </span>
        </div>
      </div>

      <div className="p-3 border-b border-gray-600">
        <h3 className="text-xs font-bold mb-2">DELETE USER PIXELS</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={deleteEmail}
            onChange={(e) => setDeleteEmail(e.target.value)}
            placeholder="user@usc.edu.ph"
            className="flex-1 bg-white/10 border border-gray-600 px-2 py-1 text-xs font-mono focus:outline-none focus:border-white"
            disabled={loading}
          />
          <button
            onClick={handleDeleteUserPixels}
            disabled={loading || !deleteEmail.trim()}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-xs"
            title="Delete all user pixels"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-xs font-bold mb-2 sticky top-0 bg-black/95 py-1">
          RECENT PIXEL HISTORY
        </h3>

        {error && (
          <div className="text-xs text-red-400 mb-2">{error}</div>
        )}

        {loading && recentPixels.length === 0 && (
          <div className="text-xs text-gray-400">Loading...</div>
        )}

        <div className="space-y-1">
          {recentPixels.map((pixel, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 transition-colors text-xs font-mono group"
            >
              <div
                className="w-4 h-4 border border-gray-600 flex-shrink-0"
                style={{ backgroundColor: pixel.color }}
                title={pixel.color}
              />
              <div className="flex-1 min-w-0">
                <div className="truncate text-gray-300">
                  {pixel.email}
                </div>
                <div className="text-gray-500 text-[10px]">
                  ({pixel.x}, {pixel.y}) • {formatTimestamp(pixel.placedAt)}
                </div>
              </div>
              <button
                onClick={() => handleRevertPixel(pixel.x, pixel.y)}
                disabled={loading}
                className="w-6 h-6 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                title="Revert this pixel"
              >
                <Undo2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

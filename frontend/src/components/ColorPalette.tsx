import { useStore } from '../store';
import { PALETTE } from '../types';

export const ColorPalette = () => {
  const selectedColor = useStore((state) => state.selectedColor);
  const setSelectedColor = useStore((state) => state.setSelectedColor);

  return (
    <div className="bg-white border-2 border-black p-6">
      <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">
        Color Palette
      </h3>
      <div className="grid grid-cols-8 gap-1 mb-4">
        {PALETTE.map((color) => (
          <button
            key={color}
            className={`w-full aspect-square border-2 transition-transform hover:scale-110 ${
              selectedColor === color
                ? 'border-black scale-110 ring-2 ring-black ring-offset-2'
                : 'border-gray-400'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
            title={color}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-100 border-2 border-black">
        <div
          className="w-12 h-12 border-2 border-black shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="font-mono font-semibold text-black text-sm">
          {selectedColor}
        </span>
      </div>
    </div>
  );
};

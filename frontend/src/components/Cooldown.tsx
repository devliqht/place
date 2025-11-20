import { useEffect } from 'react';
import { useStore } from '../store';

export const Cooldown = () => {
  const cooldown = useStore((state) => state.cooldown);
  const setCooldown = useStore((state) => state.setCooldown);

  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown(Math.max(0, cooldown - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, setCooldown]);

  if (cooldown <= 0) return null;

  return (
    <div className="bg-white border-b-2 border-black p-4">
      <div className="w-full h-3 bg-gray-200 border-2 border-black overflow-hidden mb-2">
        <div
          className="h-full bg-black transition-all duration-1000 ease-linear"
          style={{ width: `${(cooldown / 10) * 100}%` }}
        />
      </div>
      <span className="block text-center font-mono font-semibold text-black text-sm">
        Next pixel in {cooldown}s
      </span>
    </div>
  );
};

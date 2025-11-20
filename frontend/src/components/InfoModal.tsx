import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal = ({ isOpen, onClose }: InfoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
      <div className='bg-white border-4 border-black p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white'>
        <div className='flex justify-between items-start mb-6'>
          <h2 className='text-2xl font-bold text-black'>
            Information Board
          </h2>
          <button
            onClick={onClose}
            className='text-black hover:bg-gray-200 p-1 transition-colors'
            aria-label='Close'
          >
            <X size={24} />
          </button>
        </div>

        <div className='space-y-6 text-black'>
          <section>
            <h3 className='text-xl font-bold mb-2'>How It Works</h3>
            <p className='text-gray-800 leading-relaxed'>
            Hello fellow USC student! Welcome to DCISM place, a special social experiment that is heavily inspired by Reddit's own r/place event. Although this is called DCISM place, it is open to anyone with a USC account. This will make it fun and interesting 😉
            </p>
          </section>

          <section>
            <h3 className='text-xl font-bold mb-2'>Rules</h3>
            <ul className='list-disc list-inside space-y-2 text-gray-800'>
              <li>You can paint one pixel every 10 seconds</li>
              <li>Be respectful and creative! Absolutely no NSFW of any kind.</li>
              <li>Your pixels are monitored and anyone found violating the rules will have their pixels be deleted and their account banned from the place (pun intended).</li>
            </ul>
          </section>

          <section>
            <h3 className='text-xl font-bold mb-2'>Controls</h3>
            <ul className='list-disc list-inside space-y-2 text-gray-800'>
              <li>M key: Switch to Move mode</li>
              <li>P key: Switch to Paint mode</li>
              <li>Mouse wheel: Zoom in/out</li>
              <li>Left Click: Place pixel (in Paint mode)</li>
              <li>Right Click and drag: Pan canvas (in any mode)</li>
              <li>Left Click and drag: Pan canvas (in Move mode)</li>
              <li>Toggle Preview mode (Eye icon) to see the entire canvas</li>
            </ul>
          </section>

          <section>
            <h3 className='text-xl font-bold mb-2'>Credits</h3>
            <p className='text-gray-800 leading-relaxed'>
              Inspired by r/place, the collaborative art experiment from Reddit.
              Built with React, TypeScript, Express, and Socket.IO for real-time
              collaboration.
            </p>
          </section>

          <section>
            <h3 className='text-xl font-bold mb-2'>Other</h3>
            <p className='text-gray-800 leading-relaxed'>
            Developed by Matt Cabarrubias. If you wanna see my other cool stuff in DCISM, you can check out my <a className="underline" href="https://pacman.dcism.org">Pacman</a> game.
            </p>
          </section>
        </div>

        <div className='mt-8'>
          <button
            onClick={onClose}
            className='w-full bg-black text-white py-3 px-6 border-2 border-black hover:bg-gray-900 transition-colors font-bold'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal = ({ isOpen, onClose }: InfoModalProps) => {
  if (!isOpen) return null;

  const handleDontShowAgain = () => {
    localStorage.setItem('dontShowInfoModal', 'true');
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
      <div className='bg-white border-4 border-black p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white relative'>
        <button
          onClick={onClose}
          className='text-black hover:bg-gray-200 p-1 transition-colors absolute top-4 right-4'
          aria-label='Close'
        >
          <X size={24} />
        </button>

        <div className='mb-6'>
          <img
            src='/title.png'
            alt='DCISM r/place'
            className='w-full max-w-md mx-auto mb-4'
          />

          <div className='text-center flex flex-col'>
            <p className='text-sm text-gray-600 mb-2'>Co-presented by</p>
            <img
              src='/gdg.png'
              alt='Google Developer Group - University of San Carlos'
              className='w-full max-w-xs mx-auto'
            />
          </div>
        </div>

        <div className='space-y-6 text-black'>
          <section>
            <h3 className='text-xl font-bold mb-2'>Introduction</h3>
            <p className='text-gray-800 leading-relaxed'>
              Hello fellow USC student! Welcome to DCISM place, a special social
              experiment that is heavily inspired by Reddit's own r/place event.
              Although this is called DCISM place, it is open to anyone with a
              USC account. This will make it fun and interesting 😉
            </p>
          </section>

          <section>
            <h3 className='text-xl font-bold mb-2'>Rules</h3>
            <ul className='list-disc list-inside space-y-2 text-gray-800'>
              <li>You can paint one pixel every 10 seconds</li>
              <li>
                Be respectful and creative! Absolutely no NSFW of any kind.
              </li>
              <li>
                As a precaution and security measure, we require everyone to
                verify their email. Once signed up, you can start painting.
              </li>
              <li>
                Your pixels are monitored and anyone found violating the rules
                will have their pixels be deleted and their account banned from
                the place.
              </li>
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
              Built with React, Express, Socket.IO for real-time collaboration,
              Redis, PostgreSQL, hosted in Google Cloud.
            </p>
          </section>

          <section>
            <h3 className='text-xl font-bold mb-2'>Other</h3>
            <p className='text-gray-800 leading-relaxed'>
              Developed by{' '}
              <a
                className='underline'
                href='https://mattliqht.dev'
                target='_blank'
                rel='noopener noreferrer'
              >
                Matt Cabarrubias
              </a>{' '}
              . If you wanna see my other cool stuff in DCISM, you can check out
              my{' '}
              <a
                className='underline'
                href='https://pacman.dcism.org'
                target='_blank'
                rel='noopener noreferrer'
              >
                Pacman
              </a>{' '}
              game.
            </p>
          </section>
        </div>

        <div className='mt-8 space-y-2'>
          <button
            onClick={onClose}
            className='w-full bg-black text-white py-3 px-6 border-2 border-black hover:bg-gray-900 transition-colors font-bold'
          >
            Close
          </button>
          <button
            onClick={handleDontShowAgain}
            className='w-full bg-transparent text-gray-600 py-2 px-6 hover:text-black transition-colors text-sm'
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 z-50 bg-black/80 backdrop-blur-sm px-4">
      <div className="relative w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6">
        <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-t-transparent border-r-pink-500 border-b-transparent border-l-cyan-500 rounded-full animate-spin reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-cyan-400 font-display text-sm md:text-lg animate-pulse tracking-widest uppercase text-center">{message}</p>
    </div>
  );
};

export default Loader;
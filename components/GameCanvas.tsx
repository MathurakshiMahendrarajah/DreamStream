import React, { useEffect, useState, useRef } from 'react';
import { SceneData, ActionOption } from '../types';
import { audio } from '../utils/audio';

interface GameCanvasProps {
  scene: SceneData | null;
  onOptionSelect: (option: ActionOption) => void;
}

const TypewriterText: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    
    // Using slice to ensure we never duplicate content even if renders are weird
    const intervalId = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, 30); // 30ms per character for typing speed

    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  return <span>{displayedText}</span>;
};

const GameCanvas: React.FC<GameCanvasProps> = ({ scene, onOptionSelect }) => {
  // We keep a history of scenes currently "on stage" to allow for smooth cross-fades.
  const [renderedScenes, setRenderedScenes] = useState<SceneData[]>([]);
  const [showUI, setShowUI] = useState(false);
  const [textComplete, setTextComplete] = useState(false);

  useEffect(() => {
    if (scene) {
      // 1. Play Transition Sound
      audio.playTransition();
      
      // 2. Set Ambience
      audio.setAmbience(scene.ambience);

      setRenderedScenes(prev => {
        // Avoid duplicate adding of the same scene ID
        if (prev.length > 0 && prev[prev.length - 1].id === scene.id) {
          return prev;
        }
        return [...prev, scene];
      });

      // Reset UI for the entrance of the new scene
      setShowUI(false);
      setTextComplete(false);
      const uiTimer = setTimeout(() => setShowUI(true), 2000); // UI appears after image transition stabilizes

      // Cleanup old scenes after the transition duration
      const cleanupTimer = setTimeout(() => {
        setRenderedScenes(prev => {
          if (prev.length > 1) {
            return [prev[prev.length - 1]];
          }
          return prev;
        });
      }, 2500);

      return () => {
        clearTimeout(uiTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [scene]);

  const handleOptionClick = (option: ActionOption) => {
    audio.playClick();
    onOptionSelect(option);
  };

  if (renderedScenes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-600 bg-black">
        <p className="animate-pulse">Awaiting Visual Input...</p>
      </div>
    );
  }

  // The active scene is always the last one in the buffer
  const activeScene = renderedScenes[renderedScenes.length - 1];

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none group">
      
      {/* --- Visual Layer --- */}
      {renderedScenes.map((s, index) => {
        const isNewest = index === renderedScenes.length - 1;
        
        return (
          <div 
            key={s.id} 
            className={`absolute inset-0 w-full h-full ${isNewest ? 'animate-scene-enter' : ''}`}
            style={{ zIndex: index }}
          >
             {s.imageUrl && (
                <img 
                  src={s.imageUrl} 
                  alt={s.visualPrompt}
                  className="w-full h-full object-cover animate-pan"
                />
             )}
             {/* Atmosphere Overlays */}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </div>
        );
      })}

      {/* --- Narrative & Interaction Layer --- */}
      <div className={`absolute bottom-0 left-0 w-full p-4 md:p-6 pb-6 md:pb-10 z-50 transition-all duration-1000 ease-out ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-4xl mx-auto">
              
              {/* Story Text */}
              <div className="glass-panel p-4 md:p-6 rounded-t-lg border-b-0 relative overflow-hidden backdrop-blur-2xl bg-black/60">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                  <p className="text-lg md:text-2xl lg:text-3xl text-white font-medium drop-shadow-lg leading-snug tracking-wide min-h-[3rem] md:min-h-[4rem]">
                    {showUI && (
                      <TypewriterText 
                        text={activeScene.narrative} 
                        onComplete={() => setTextComplete(true)} 
                      />
                    )}
                  </p>
              </div>

              {/* Options Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 bg-black/80 p-3 md:p-4 rounded-b-lg border border-white/10 backdrop-blur-md transition-opacity duration-500 ${textComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {activeScene.options.map((option, idx) => (
                  <button
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  className="relative overflow-hidden group/btn px-4 py-3 md:px-6 md:py-4 text-left border border-white/10 hover:border-cyan-400/50 transition-all duration-300 bg-white/5 hover:bg-cyan-900/20 rounded active:scale-[0.98] md:active:scale-100 touch-manipulation"
                  >
                  <span className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover/btn:bg-cyan-400 transition-colors"></span>
                  <span className="font-display text-[10px] md:text-xs text-cyan-400 opacity-70 mb-0.5 md:mb-1 block tracking-wider uppercase">Option 0{idx + 1}</span>
                  <span className="text-gray-100 font-bold text-base md:text-lg group-hover/btn:text-white transition-colors leading-tight block">{option.label}</span>
                  </button>
              ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default GameCanvas;
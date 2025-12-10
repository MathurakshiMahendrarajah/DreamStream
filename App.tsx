import React, { useState, useCallback, useMemo } from 'react';
import { GameState, SceneData, ActionOption } from './types';
import { generateSceneLogic, generateSceneImage } from './services/gemini';
import GameCanvas from './components/GameCanvas';
import Loader from './components/Loader';
import { audio } from './utils/audio';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    currentScene: null,
    history: [],
    loading: false,
    loadingMessage: '',
    error: null,
  });

  // Track if we need to check API key
  const hasApiKey = !!process.env.API_KEY;

  // Generate random particles for landing page
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 10 + 5}s`,
      animationDelay: `${Math.random() * 5}s`,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
    }));
  }, []);

  const handleStartGame = useCallback(async (initialPrompt: string) => {
    if (!initialPrompt.trim()) return;

    // Initialize Audio Engine on user interaction
    audio.init();
    audio.resume();
    audio.playClick();

    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      loading: true,
      loadingMessage: 'Initializing Neural Dream Engine...',
      error: null
    }));

    try {
      // 1. Generate Logic
      setGameState(prev => ({ ...prev, loadingMessage: 'Weaving the Narrative...' }));
      const logicData = await generateSceneLogic(initialPrompt, "Start of a new adventure. The player has just entered.");
      
      // 2. Generate Visuals
      setGameState(prev => ({ ...prev, loadingMessage: 'Materializing World...' }));
      const base64Image = await generateSceneImage(logicData.visualPrompt);

      const newScene: SceneData = {
        id: crypto.randomUUID(),
        ...logicData,
        imageUrl: base64Image
      };

      setGameState(prev => ({
        ...prev,
        currentScene: newScene,
        history: [newScene],
        loading: false
      }));

    } catch (error: any) {
      console.error(error);
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: "Simulation failed. Connection interrupted. Try again."
      }));
    }
  }, []);

  const handleOptionSelect = useCallback(async (option: ActionOption) => {
    if (!gameState.currentScene) return;

    setGameState(prev => ({
      ...prev,
      loading: true,
      loadingMessage: `Choosing path: ${option.label}...`,
      error: null
    }));

    try {
      // Summarize history for context (last 3 scenes)
      const recentHistory = gameState.history.slice(-3).map(h => h.narrative).join(" -> ");
      
      // 1. Generate Next Scene Logic
      setGameState(prev => ({ ...prev, loadingMessage: 'Unfolding Destiny...' }));
      const logicData = await generateSceneLogic(option.actionPrompt, recentHistory);

      // 2. Generate Next Scene Visual
      setGameState(prev => ({ ...prev, loadingMessage: 'Rendering Reality...' }));
      const base64Image = await generateSceneImage(logicData.visualPrompt);

      const newScene: SceneData = {
        id: crypto.randomUUID(),
        ...logicData,
        imageUrl: base64Image
      };

      setGameState(prev => ({
        ...prev,
        currentScene: newScene,
        history: [...prev.history, newScene],
        loading: false
      }));

    } catch (error: any) {
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: "Lost connection to the dream stream. Please retry."
      }));
    }
  }, [gameState.history, gameState.currentScene]);

  const resetGame = () => {
    audio.playClick();
    audio.stop(); // Stop all ambient sound
    setGameState({
      isPlaying: false,
      currentScene: null,
      history: [],
      loading: false,
      loadingMessage: '',
      error: null
    });
    setInput('');
  };

  if (!hasApiKey) {
     return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
           <div className="max-w-md text-center bg-red-900/10 border border-red-500 p-8 rounded-lg">
              <h1 className="text-3xl font-display text-red-500 mb-4 animate-pulse">SYSTEM ERROR</h1>
              <p>API Key missing in environment variables.</p>
           </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Header - Always visible but minimal */}
      <header className={`fixed top-0 w-full z-50 p-4 md:p-6 transition-all duration-500 ${gameState.isPlaying ? 'bg-black/50 backdrop-blur-md border-b border-white/5' : ''}`}>
        <div className="flex justify-between items-center max-w-7xl mx-auto">
            <h1 className={`font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 transition-all ${gameState.isPlaying ? 'text-lg md:text-xl' : 'text-xl md:text-2xl opacity-50'}`}>
              DREAMSTREAM
            </h1>
            {gameState.isPlaying && (
              <button 
                onClick={resetGame}
                className="pointer-events-auto px-3 py-1.5 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-widest border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition rounded-sm backdrop-blur-md"
              >
                Abort Sim
              </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative h-screen w-full overflow-hidden">
        
        {/* Intro Screen / Landing Page */}
        {!gameState.isPlaying && !gameState.loading && (
          <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden bg-black perspective-container w-full h-full">
             
             {/* 1. Animated Moving Grid Floor */}
             <div className="grid-floor opacity-40"></div>
             
             {/* 2. Atmospheric Fog/Gradients */}
             <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-cyan-900/20 pointer-events-none"></div>
             
             {/* 3. Floating Particles */}
             {particles.map((p, i) => (
                <div 
                  key={i} 
                  className="particle"
                  style={{
                    left: p.left,
                    width: `${p.width}px`,
                    height: `${p.height}px`,
                    animationDuration: p.animationDuration,
                    animationDelay: p.animationDelay
                  }}
                ></div>
             ))}

             {/* 4. Scanline Overlay */}
             <div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-10"></div>

             {/* 5. Main Content Card */}
             <div className="relative z-20 w-full max-w-5xl px-4 flex flex-col items-center justify-center min-h-[50vh]">
                
                {/* Title Section */}
                <div className="text-center mb-8 md:mb-12 relative w-full px-2">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[150px] md:h-[200px] bg-cyan-500/20 blur-[60px] md:blur-[100px] rounded-full pointer-events-none"></div>
                   <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-gradient-text mb-2 md:mb-4 relative z-10 drop-shadow-2xl py-2 px-2 break-words">
                     DREAMSTREAM
                   </h2>
                   <p className="text-cyan-200/60 font-mono text-[10px] md:text-base tracking-[0.3em] md:tracking-[0.5em] uppercase">
                     Visual Narrative Engine v2.5
                   </p>
                </div>
                
                {/* Holographic Input Card */}
                <div className="w-full max-w-xl bg-black/40 backdrop-blur-xl border border-white/10 p-1 relative group overflow-hidden mx-auto">
                  {/* Decorative Corners */}
                  <div className="absolute top-0 left-0 w-3 h-3 md:w-4 md:h-4 border-l-2 border-t-2 border-cyan-500"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 md:w-4 md:h-4 border-r-2 border-t-2 border-cyan-500"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 md:w-4 md:h-4 border-l-2 border-b-2 border-cyan-500"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 border-r-2 border-b-2 border-cyan-500"></div>

                  <div className="relative bg-black/60 p-4 md:p-6 flex flex-col gap-3 md:gap-4">
                     <p className="text-gray-400 font-light text-center leading-relaxed text-sm md:text-base">
                        Input a starting scenario. The AI will generate a visual world, ambient audio, and twist-filled storyline.
                     </p>
                     
                     <div className="relative mt-1 md:mt-2">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleStartGame(input)}
                          placeholder="Ex: Waking up in a falling airplane..."
                          // text-base prevents iOS zoom on focus
                          className="w-full bg-white/5 border-b border-white/20 px-3 py-3 md:px-4 text-base md:text-lg text-white placeholder-gray-600 outline-none focus:border-cyan-500 focus:bg-white/10 transition-all font-sans rounded-t"
                          autoFocus
                        />
                        <div className="absolute right-0 bottom-0 h-[1px] w-0 bg-cyan-500 transition-all duration-500 group-hover:w-full"></div>
                     </div>

                     <button
                        onClick={() => handleStartGame(input)}
                        disabled={!input.trim()}
                        className="w-full mt-2 md:mt-4 bg-cyan-600/20 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/50 py-3 md:py-4 font-display font-bold text-lg md:text-xl tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] touch-manipulation"
                     >
                        Initialize Simulation
                     </button>
                  </div>
                </div>

                {/* Quick Start Chips */}
                <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3 opacity-70">
                  {[
                    "Cyberpunk Detective",
                    "Lost in a Magic Forest",
                    "Zombie Apocalypse Mall",
                    "Mars Colony Escape"
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="px-3 py-2 text-[10px] md:text-xs font-mono bg-black border border-white/20 hover:border-cyan-400 hover:text-cyan-400 transition-colors uppercase tracking-wider active:bg-white/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* Game Screen */}
        {gameState.isPlaying && (
          <GameCanvas 
            scene={gameState.currentScene} 
            onOptionSelect={handleOptionSelect}
          />
        )}

        {/* Loader Overlay */}
        {gameState.loading && <Loader message={gameState.loadingMessage} />}

        {/* Error Overlay */}
        {gameState.error && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
             <div className="bg-red-900/20 border border-red-500/50 p-6 md:p-8 max-w-md w-full text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
               <h3 className="text-red-500 font-display text-xl md:text-2xl mb-4 tracking-widest">CRITICAL ERROR</h3>
               <p className="text-gray-300 mb-6 md:mb-8 font-light text-sm md:text-base">{gameState.error}</p>
               <button 
                onClick={() => setGameState(prev => ({ ...prev, loading: false, error: null }))}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 md:px-8 md:py-3 font-bold uppercase tracking-widest text-xs md:text-sm transition-all"
               >
                 Reboot System
               </button>
             </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;
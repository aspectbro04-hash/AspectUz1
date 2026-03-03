import React from 'react';
import { useGame } from '../context/GameContext';
import { RoleCard } from './RoleCard';
import { PlayerGrid } from './PlayerGrid';
import { Chat } from './Chat';
import { StatusHeader } from './StatusHeader';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Clock, AlertTriangle } from 'lucide-react';

export const GameScreen = () => {
  const { gameState, performAction, vote, leaveRoom } = useGame();

  if (!gameState || !gameState.myPlayer) return null;

  const { phase, players, myPlayer, logs, timer, winner } = gameState;
  const isNight = phase === 'NIGHT';
  const isVoting = phase === 'VOTING';
  const isDay = phase === 'DAY';
  const isGameOver = phase === 'GAME_OVER';

  const getPhaseIcon = () => {
    if (isNight) return <Moon className="text-blue-400" size={32} />;
    if (isDay || isVoting) return <Sun className="text-yellow-400" size={32} />;
    return <AlertTriangle className="text-red-500" size={32} />;
  };

  const getPhaseTitle = () => {
    if (isNight) return 'NIGHT PHASE';
    if (isDay) return 'DAY PHASE';
    if (isVoting) return 'VOTING PHASE';
    if (isGameOver) return 'GAME OVER';
    return phase;
  };

  const getPhaseDescription = () => {
    if (isNight) return 'Mafia kills, Doctor saves, Sheriff investigates.';
    if (isDay) return 'Discuss who the Mafia might be.';
    if (isVoting) return 'Vote to eliminate a suspect.';
    if (isGameOver) return winner === 'MAFIA' ? 'The Mafia has taken over the town!' : 'The Town has eliminated all Mafia!';
    return '';
  };

  // Speech Synthesis
  React.useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      const utterance = new SpeechSynthesisUtterance(lastLog);
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [logs]);

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isNight ? 'bg-slate-950' : 'bg-sky-950'} text-white p-4 md:p-8 overflow-hidden relative`}>
      
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {isNight && (
          <div className="absolute top-10 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        )}
        {!isNight && (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-sky-400/10 to-transparent" />
        )}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Column: Role & Status */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPhaseIcon()}
                <div>
                  <h2 className="font-bold text-xl tracking-tight">{getPhaseTitle()}</h2>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest">{getPhaseDescription()}</p>
                </div>
              </div>
            </div>
            
            {!isGameOver && (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/5">
                <Clock size={18} className={timer < 10 ? 'text-red-400 animate-pulse' : 'text-zinc-400'} />
                <span className={`font-mono text-2xl font-bold ${timer < 10 ? 'text-red-400' : 'text-white'}`}>
                  {timer}s
                </span>
                <span className="text-xs text-zinc-500 uppercase ml-auto">Time Remaining</span>
              </div>
            )}
          </motion.div>

          <RoleCard role={myPlayer.role || 'CIVILIAN'} name={myPlayer.name} />
          
          {!myPlayer.isAlive && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-950/50 border border-red-500/30 p-4 rounded-xl text-center"
            >
              <h3 className="text-red-400 font-bold uppercase tracking-widest mb-1">You are Dead</h3>
              <p className="text-xs text-red-300/70">You can spectate but cannot vote or chat.</p>
            </motion.div>
          )}
        </div>

        {/* Middle Column: Game Grid */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/5 shadow-2xl overflow-y-auto custom-scrollbar">
            <PlayerGrid 
              players={players} 
              myPlayer={myPlayer} 
              phase={phase} 
              onAction={performAction}
              onVote={vote}
            />
          </div>
        </div>

        {/* Right Column: Chat/Logs */}
        <div className="lg:col-span-1 h-full">
          <Chat logs={logs} phase={phase} />
        </div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-700 p-10 rounded-3xl shadow-2xl text-center max-w-lg w-full"
            >
              <h1 className={`text-6xl font-black mb-4 ${winner === 'MAFIA' ? 'text-red-500' : 'text-emerald-500'}`}>
                {winner} WINS!
              </h1>
              <p className="text-zinc-400 mb-8 text-lg">
                {winner === 'MAFIA' 
                  ? 'The town has fallen into darkness.' 
                  : 'The town has been cleansed of evil.'}
              </p>
              <button 
                onClick={leaveRoom}
                className="bg-white text-black font-bold py-4 px-8 rounded-xl hover:bg-zinc-200 transition-colors w-full"
              >
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

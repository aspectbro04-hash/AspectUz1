import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'motion/react';
import { Users, Play, LogOut, Copy } from 'lucide-react';

export const Lobby = () => {
  const { gameState, createRoom, joinRoom, startGame, leaveRoom, error } = useGame();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  if (gameState) {
    // Waiting Room
    const isHost = gameState.hostId === gameState.myPlayer?.id;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-800 p-8 rounded-2xl shadow-xl border border-zinc-700"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-mono">LOBBY</h2>
            <button onClick={leaveRoom} className="text-red-400 hover:text-red-300 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
          
          <div className="bg-zinc-900 p-4 rounded-lg mb-6 flex justify-between items-center border border-zinc-700">
            <div>
              <span className="text-zinc-400 text-sm uppercase tracking-wider">Room Code</span>
              <div className="text-3xl font-mono font-bold text-emerald-400 tracking-widest">{gameState.roomId}</div>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(gameState.roomId)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
            >
              <Copy size={18} className="text-zinc-400" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-zinc-400 text-sm uppercase tracking-wider">
              <Users size={16} />
              <span>Players ({gameState.players.length}/12)</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {gameState.players.map((player) => (
                <div 
                  key={player.id} 
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    player.id === gameState.myPlayer?.id 
                      ? 'bg-emerald-900/30 border border-emerald-500/30' 
                      : 'bg-zinc-700/50'
                  }`}
                >
                  <span className="font-medium">{player.name}</span>
                  {player.id === gameState.hostId && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30">HOST</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 4}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                gameState.players.length >= 4
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Play size={20} />
              START GAME
            </button>
          ) : (
            <div className="text-center text-zinc-500 italic py-4">
              Waiting for host to start...
            </div>
          )}
          
          {gameState.players.length < 4 && (
            <p className="text-center text-red-400/80 text-xs mt-3">
              Need at least 4 players to start.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#2a1510_0%,transparent_60%)] opacity-40 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold font-serif tracking-tighter mb-2 text-white">MAFIA</h1>
          <p className="text-zinc-400 text-sm uppercase tracking-widest">Online Social Deduction</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          {!isJoining ? (
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (name) createRoom(name);
                }}
                disabled={!name}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CREATE ROOM
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs uppercase">Or</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              <button
                onClick={() => setIsJoining(true)}
                className="w-full bg-zinc-800 text-zinc-300 font-bold py-4 rounded-xl hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                JOIN ROOM
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ex. X7K9P2"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono tracking-widest uppercase"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsJoining(false)}
                  className="flex-1 bg-zinc-800 text-zinc-400 font-bold py-4 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  BACK
                </button>
                <button
                  onClick={() => {
                    if (name && roomCode) joinRoom(roomCode, name);
                  }}
                  disabled={!name || !roomCode}
                  className="flex-[2] bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                >
                  JOIN
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

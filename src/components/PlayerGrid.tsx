import React from 'react';
import { motion } from 'motion/react';
import { Player, Phase, Role } from '../types';
import { Skull, Vote, User } from 'lucide-react';

interface PlayerGridProps {
  players: (Omit<Player, 'role' | 'actionTarget'> & { role?: Role })[];
  myPlayer?: Player;
  phase: Phase;
  onAction: (targetId: string) => void;
  onVote: (targetId: string) => void;
}

export const PlayerGrid = ({ players, myPlayer, phase, onAction, onVote }: PlayerGridProps) => {
  const isAlive = myPlayer?.isAlive;
  const myRole = myPlayer?.role;

  const canAct = (targetId: string) => {
    if (!isAlive) return false;
    if (targetId === myPlayer?.id) return false;

    if (phase === 'NIGHT') {
      if (myRole === 'MAFIA') return true;
      if (myRole === 'DOCTOR') return true;
      if (myRole === 'SHERIFF') return true;
    }
    return false;
  };

  const canVote = (targetId: string) => {
    if (!isAlive) return false;
    if (phase !== 'VOTING') return false;
    if (targetId === myPlayer?.id) return false;
    return true;
  };

  const getActionLabel = () => {
    if (phase === 'NIGHT') {
      if (myRole === 'MAFIA') return 'ELIMINATE';
      if (myRole === 'DOCTOR') return 'PROTECT';
      if (myRole === 'SHERIFF') return 'INVESTIGATE';
    }
    return '';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {players.map((player) => {
        const isMe = player.id === myPlayer?.id;
        const isDead = !player.isAlive;
        
        const showAction = canAct(player.id) && !isDead;
        const showVote = canVote(player.id) && !isDead;

        return (
          <motion.div
            key={player.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isDead ? 0.6 : 1, scale: 1 }}
            className={`
              relative p-4 rounded-xl border transition-all overflow-hidden group flex flex-col
              ${isDead ? 'bg-zinc-900 border-zinc-800 grayscale opacity-50' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500'}
              ${isMe ? 'ring-1 ring-white/20' : ''}
              ${player.vote ? 'ring-2 ring-yellow-500/50' : ''}
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-2xl shadow-inner
                  ${isDead ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-700 text-white group-hover:bg-zinc-600 transition-colors'}
                  ${isMe ? 'bg-red-900/50 text-white border border-red-500/30' : ''}
                `}>
                  {isDead ? <Skull size={18} /> : (player.avatar || <User size={18} />)}
                </div>
                <div>
                  <div className="font-bold text-sm text-white truncate max-w-[100px] uppercase tracking-wide">{player.name}</div>
                  {isMe && <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">YOU</div>}
                  {isDead && <div className="text-[10px] text-red-500 uppercase tracking-widest font-bold">DECEASED</div>}
                </div>
              </div>
            </div>

            {/* Role Reveal */}
            {player.role && (
              <div className="mt-auto mb-3">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Role Revealed</div>
                <div className={`text-xs font-black uppercase px-2 py-1 rounded w-fit ${
                  player.role === 'MAFIA' ? 'bg-red-900/30 text-red-500 border border-red-900/50' : 
                  player.role === 'CIVILIAN' ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-900/50' :
                  'bg-blue-900/30 text-blue-400 border border-blue-900/50'
                }`}>
                  {player.role}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto space-y-2">
              {showAction && (
                <button
                  onClick={() => onAction(player.id)}
                  className={`
                    w-full py-3 rounded-lg text-xs font-black tracking-widest transition-all uppercase shadow-lg flex items-center justify-center gap-2
                    ${myRole === 'MAFIA' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' : ''}
                    ${myRole === 'DOCTOR' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : ''}
                    ${myRole === 'SHERIFF' ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-yellow-900/20' : ''}
                  `}
                >
                  {getActionLabel()}
                </button>
              )}

              {showVote && (
                <button
                  onClick={() => onVote(player.id)}
                  className="w-full py-3 rounded-lg text-xs font-black tracking-widest transition-all uppercase bg-zinc-200 text-black hover:bg-white hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                >
                  <Vote size={14} />
                  VOTE
                </button>
              )}
            </div>

            {/* Vote Count Overlay */}
            {phase === 'VOTING' && (
               <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
                 {players.filter(p => p.vote === player.id).map((voter) => (
                   <motion.div 
                     key={voter.id}
                     initial={{ scale: 0, x: 10 }}
                     animate={{ scale: 1, x: 0 }}
                     className="text-[10px] bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-20"
                   >
                     {voter.name}
                   </motion.div>
                 ))}
               </div>
            )}

          </motion.div>
        );
      })}
    </div>
  );
};

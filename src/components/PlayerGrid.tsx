import React from 'react';
import { motion } from 'motion/react';
import { Player, Phase, Role } from '../types';
import { Skull, Shield, Search, User, CheckCircle, Vote } from 'lucide-react';

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
    if (targetId === myPlayer?.id) return false; // Can't target self usually

    if (phase === 'NIGHT') {
      if (myRole === 'MAFIA') return true;
      if (myRole === 'DOCTOR') return true; // Doctor can save self? Let's say yes for now.
      if (myRole === 'SHERIFF') return true;
    }
    return false;
  };

  const canVote = (targetId: string) => {
    if (!isAlive) return false;
    if (phase !== 'VOTING') return false;
    if (targetId === myPlayer?.id) return false; // Can't vote self
    return true;
  };

  const getActionLabel = () => {
    if (phase === 'NIGHT') {
      if (myRole === 'MAFIA') return 'KILL';
      if (myRole === 'DOCTOR') return 'SAVE';
      if (myRole === 'SHERIFF') return 'CHECK';
    }
    return '';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {players.map((player) => {
        const isMe = player.id === myPlayer?.id;
        const isDead = !player.isAlive;
        
        // Action Logic
        const showAction = canAct(player.id) && !isDead;
        const showVote = canVote(player.id) && !isDead;

        return (
          <motion.div
            key={player.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isDead ? 0.5 : 1, scale: 1 }}
            className={`
              relative p-4 rounded-xl border transition-all overflow-hidden group
              ${isDead ? 'bg-zinc-900/50 border-zinc-800 grayscale' : 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-500'}
              ${isMe ? 'ring-1 ring-emerald-500/50' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner
                  ${isDead ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-700 text-white group-hover:bg-zinc-600 transition-colors'}
                `}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-white truncate max-w-[100px]">{player.name}</div>
                  {isMe && <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">YOU</div>}
                </div>
              </div>
              {isDead && <Skull size={18} className="text-zinc-600" />}
            </div>

            {/* Role Reveal (if applicable) */}
            {player.role && (
              <div className="mt-2 text-xs font-mono px-2 py-1 rounded bg-black/30 inline-block text-zinc-300 border border-white/5 mb-2">
                {player.role}
              </div>
            )}

            {/* Action Button */}
            {showAction && (
              <button
                onClick={() => onAction(player.id)}
                className={`
                  w-full py-2 rounded-lg text-xs font-bold tracking-wider transition-all uppercase shadow-lg
                  ${myRole === 'MAFIA' ? 'bg-red-900/80 text-red-100 hover:bg-red-800 hover:shadow-red-900/20' : ''}
                  ${myRole === 'DOCTOR' ? 'bg-blue-900/80 text-blue-100 hover:bg-blue-800 hover:shadow-blue-900/20' : ''}
                  ${myRole === 'SHERIFF' ? 'bg-yellow-900/80 text-yellow-100 hover:bg-yellow-800 hover:shadow-yellow-900/20' : ''}
                `}
              >
                {getActionLabel()}
              </button>
            )}

            {/* Vote Button */}
            {showVote && (
              <button
                onClick={() => onVote(player.id)}
                className="w-full py-2 rounded-lg text-xs font-bold tracking-wider transition-all uppercase bg-zinc-700 text-white hover:bg-zinc-600 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Vote size={12} />
                VOTE
              </button>
            )}

            {/* Vote Indicator */}
            {/* Show who voted for whom if revealed? Or just count? */}
            {/* Usually in Mafia, votes are public. */}
            {/* But my state doesn't link votes to targets easily in the sanitized state unless I add it. */}
            {/* I'll assume `vote` property on player is the ID they voted FOR. */}
            
            {/* Wait, `player.vote` is the ID of the person they voted FOR. */}
            {/* So if I want to show who voted for THIS player, I need to check all players. */}
            
            {/* Let's show a count of votes on this player */}
            {phase === 'VOTING' && (
               <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
                 {players.filter(p => p.vote === player.id).map((voter, i) => (
                   <motion.div 
                     key={voter.id}
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="text-[10px] bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded-full border border-yellow-500/30 whitespace-nowrap"
                   >
                     Voted by {voter.name}
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

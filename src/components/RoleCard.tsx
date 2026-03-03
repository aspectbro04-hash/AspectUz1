import React from 'react';
import { motion } from 'motion/react';
import { Shield, Skull, Search, User } from 'lucide-react';
import { Role } from '../types';

interface RoleCardProps {
  role: Role;
  name: string;
}

const roleConfig = {
  MAFIA: {
    icon: Skull,
    color: 'text-red-500',
    bg: 'bg-red-950/30',
    border: 'border-red-900/50',
    description: 'Eliminate the townspeople at night. Don\'t get caught.',
  },
  DOCTOR: {
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-950/30',
    border: 'border-blue-900/50',
    description: 'Save one person each night from the Mafia.',
  },
  SHERIFF: {
    icon: Search,
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/30',
    border: 'border-yellow-900/50',
    description: 'Investigate one person each night to find the Mafia.',
  },
  CIVILIAN: {
    icon: User,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-900/50',
    description: 'Find the Mafia during the day and vote them out.',
  },
};

export const RoleCard = ({ role, name }: RoleCardProps) => {
  const config = roleConfig[role] || roleConfig.CIVILIAN;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`relative overflow-hidden rounded-2xl p-6 ${config.bg} border ${config.border} shadow-lg backdrop-blur-sm`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Icon size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-black/20 ${config.color}`}>
            <Icon size={24} />
          </div>
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Your Role</span>
        </div>
        
        <h2 className={`text-3xl font-bold ${config.color} mb-1 tracking-tight`}>{role}</h2>
        <p className="text-zinc-300 text-sm leading-relaxed max-w-[80%]">{config.description}</p>
      </div>
    </motion.div>
  );
};

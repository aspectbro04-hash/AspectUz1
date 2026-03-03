import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Phase } from '../types';

interface ChatProps {
  logs: string[];
  phase: Phase;
}

export const Chat = ({ logs, phase }: ChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/80">
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Game Log</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
        {logs.map((log, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-zinc-300 border-l-2 border-zinc-700 pl-3 py-1"
          >
            {log}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

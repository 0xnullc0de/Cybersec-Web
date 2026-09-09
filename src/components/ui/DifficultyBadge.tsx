import React from 'react';
import { Difficulty } from '@/types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
}

export default function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const getDifficultyStyle = () => {
    switch (difficulty) {
      case 'Easy':
        return {
          dot: 'bg-emerald-400 shadow-[0_0_8px_#22c55e]',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'Medium':
        return {
          dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
          text: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'Hard':
        return {
          dot: 'bg-red-400 shadow-[0_0_8px_#ef4444]',
          text: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
        };
      case 'Insane':
        return {
          dot: 'bg-purple-400 shadow-[0_0_8px_#a855f7]',
          text: 'text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/20',
        };
      default:
        return {
          dot: 'bg-gray-400',
          text: 'text-gray-400',
          bg: 'bg-gray-500/10 border-gray-500/20',
        };
    }
  };

  const style = getDifficultyStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${style.bg} ${style.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{difficulty}</span>
    </span>
  );
}

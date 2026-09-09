import React from 'react';
import { Platform } from '@/types';
import { Box, ShieldAlert, Globe, Terminal } from 'lucide-react';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md';
}

export default function PlatformBadge({ platform, size = 'md' }: PlatformBadgeProps) {
  const getBadgeStyle = () => {
    switch (platform) {
      case 'HTB':
        return {
          bg: 'bg-[#9fef00]/10',
          border: 'border-[#9fef00]/30',
          text: 'text-[#9fef00]',
          icon: Box,
          label: 'Hack The Box',
        };
      case 'THM':
        return {
          bg: 'bg-[#ff2d55]/10',
          border: 'border-[#ff2d55]/30',
          text: 'text-[#ff2d55]',
          icon: ShieldAlert,
          label: 'TryHackMe',
        };
      case 'Proving Grounds':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          icon: Globe,
          label: 'OffSec PG',
        };
      default:
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          icon: Terminal,
          label: platform,
        };
    }
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px] gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold rounded border ${style.bg} ${style.border} ${style.text} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
      <span>{style.label}</span>
    </span>
  );
}

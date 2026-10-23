import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, elevated = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-potato-surface rounded-[2rem] border border-potato-border p-6 transition-all duration-300',
        elevated ? 'shadow-md border-[#D5D3C7]' : 'shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

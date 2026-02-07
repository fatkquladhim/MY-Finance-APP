import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
}

export default function Card({ children, title, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`card ${noPadding ? 'p-0' : ''} ${className}`}>
      {title && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

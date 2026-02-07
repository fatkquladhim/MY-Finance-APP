import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`min-h-screen bg-gray-50 dark:bg-dark-bg-primary pb-20 md:pb-0 animate-fade-in ${className}`}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
}

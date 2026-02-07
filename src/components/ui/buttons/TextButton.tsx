import React from 'react';

interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'muted';
}

export default function TextButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: TextButtonProps) {
  const variantClasses = {
    primary: 'text-primary-600 hover:text-primary-700',
    danger: 'text-error-600 hover:text-error-700',
    muted: 'text-gray-500 hover:text-gray-700',
  };

  return (
    <button
      className={`font-medium transition-colors duration-200 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

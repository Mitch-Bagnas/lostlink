import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  light?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', light = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid ${
        light ? 'border-white border-t-transparent' : 'border-sky border-t-transparent'
      } ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

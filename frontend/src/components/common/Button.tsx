import React, { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'sky' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const variantClasses = {
    primary: 'bg-ink text-white hover:bg-ink-hover shadow-sm',
    sky: 'bg-sky text-white hover:bg-sky-hover shadow-sm',
    secondary: 'bg-paper text-ink border border-line hover:bg-white shadow-sm',
    danger: 'bg-lost text-white hover:bg-lost/90 shadow-sm',
    ghost: 'bg-transparent text-muted hover:text-ink hover:bg-paper',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" light={variant !== 'secondary' && variant !== 'ghost'} />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

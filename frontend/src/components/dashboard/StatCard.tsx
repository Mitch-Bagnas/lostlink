import React, { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: ReactNode;
  variant?: 'default' | 'safe' | 'lost' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white border-line text-ink',
    safe: 'bg-white border-safe/30 text-safe',
    lost: 'bg-white border-lost/30 text-lost',
    sky: 'bg-white border-sky/30 text-sky',
  };

  const iconBgStyles = {
    default: 'bg-paper text-muted',
    safe: 'bg-safe-light text-safe',
    lost: 'bg-lost-light text-lost',
    sky: 'bg-sky-light text-sky',
  };

  return (
    <div
      className={`rounded-2xl p-5 border shadow-soft transition-all duration-200 hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="text-3xl font-extrabold text-ink mt-1 tracking-tight">{value}</p>
          {sublabel && <p className="text-xs text-muted mt-1">{sublabel}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${iconBgStyles[variant]}`}>{icon}</div>
      </div>
    </div>
  );
};

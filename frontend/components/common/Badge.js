import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border transition-colors select-none';

  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    ready: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-sm shadow-emerald-500/20 font-bold',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  const dotColors = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-blue-400',
    purple: 'bg-purple-400',
    neutral: 'bg-slate-400',
    ready: 'bg-emerald-400 animate-ping',
  };

  const currentVariant = variants[variant] || variants.neutral;
  const currentSize = sizes[size] || sizes.md;
  const currentDot = dotColors[variant] || dotColors.neutral;

  return (
    <span className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`} {...props}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />}
      <span>{children}</span>
    </span>
  );
}


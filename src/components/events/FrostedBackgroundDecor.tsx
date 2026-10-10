import React from 'react';

export const FrostedBackgroundDecor: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-faint opacity-80" />
      
      {/* Soft Blurred Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-[100px] transform-gpu" />
      <div className="absolute top-1/4 right-0 w-[420px] h-[420px] rounded-full bg-teal-400/15 blur-[120px] transform-gpu" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-amber-400/12 blur-[90px] transform-gpu" />
    </div>
  );
};

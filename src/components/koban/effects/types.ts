import React from 'react';

export interface CinematicEffectProps {
  isLowEnd?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

export interface EffectComponentModule {
  FullScene: React.FC<CinematicEffectProps>;
  ThumbnailPreview: React.FC<{ className?: string }>;
}

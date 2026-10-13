import React from 'react';
import { ArenaLandingPage } from '../arena/ArenaLandingPage';

interface ArenaLandingProps {
  onNavigate: (route: string) => void;
}

export const ArenaLanding: React.FC<ArenaLandingProps> = ({ onNavigate }) => {
  return <ArenaLandingPage onNavigate={onNavigate} />;
};

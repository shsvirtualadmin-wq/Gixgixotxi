import { useState, useEffect, useCallback } from 'react';

export type WallpaperId = 'crimson-arc' | 'ember-grid' | 'midnight';

export interface WallpaperOption {
  id: WallpaperId;
  name: string;
  tagline: string;
  description: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'crimson-arc',
    name: 'Crimson Arc',
    tagline: 'Default Signature',
    description: 'Deep red radial glow, concentric arcs, circuit traces, and dot-matrix grid.',
  },
  {
    id: 'ember-grid',
    name: 'Ember Grid',
    tagline: 'Precision Technical',
    description: 'Near-black with a subtle red dot-matrix grid fading gently toward the edges.',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Minimal Stealth',
    description: 'Deep near-black base with a soft, velvety crimson vignette.',
  },
];

const STORAGE_KEY = 'boardly_custom_wallpaper';
const EVENT_NAME = 'boardly_wallpaper_change';

export function getStoredWallpaper(): WallpaperId {
  if (typeof window === 'undefined') return 'crimson-arc';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as WallpaperId | null;
    if (saved && (saved === 'crimson-arc' || saved === 'ember-grid' || saved === 'midnight')) {
      return saved;
    }
  } catch {
    // localStorage not accessible
  }
  return 'crimson-arc';
}

export function useWallpaper() {
  const [wallpaper, setWallpaperState] = useState<WallpaperId>(getStoredWallpaper);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setWallpaperState(e.newValue as WallpaperId);
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<WallpaperId>;
      if (customEvent.detail) {
        setWallpaperState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_NAME, handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_NAME, handleCustomChange);
    };
  }, []);

  const setWallpaper = useCallback((newId: WallpaperId) => {
    try {
      localStorage.setItem(STORAGE_KEY, newId);
    } catch {
      // Ignore storage error
    }
    setWallpaperState(newId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newId }));
    }
  }, []);

  return {
    wallpaper,
    setWallpaper,
    wallpapers: WALLPAPERS,
  };
}

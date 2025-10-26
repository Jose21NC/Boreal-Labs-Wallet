/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setEnabled as setSoundEnabled, isEnabled as soundIsEnabled, prime as primeSound } from '@/lib/sound';

const SettingsContext = createContext(null);

const THEME_KEY = 'blw_theme'; // 'light' | 'dark'

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [soundsEnabled, setSoundsEnabled] = useState(false);

  // Load persisted settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch (e) {
      // Ignorar fallo de acceso a localStorage (modo privado u otros)
      console.debug('No se pudo leer configuración de tema desde localStorage:', e?.message || e);
    }
    // Load sounds from sound module (which reads LS lazily)
    setSoundsEnabled(soundIsEnabled());
    // Prime audio context on first gesture later
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {
      // Ignorar fallo de escritura en localStorage
      console.debug('No se pudo guardar configuración de tema en localStorage:', e?.message || e);
    }
  }, [theme]);

  // Reflect sounds setting to sound module
  useEffect(() => {
    setSoundEnabled(soundsEnabled);
  }, [soundsEnabled]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    soundsEnabled,
    setSoundsEnabled,
    toggleSounds: () => setSoundsEnabled((v) => !v),
    primeSound,
  }), [theme, soundsEnabled]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

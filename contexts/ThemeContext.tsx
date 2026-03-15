import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DarkColors, LightColors } from '../constants/theme';

type ThemeContextValue = {
  colors: typeof DarkColors;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: DarkColors,
  darkMode: true,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
});

const STORAGE_KEY = 'serbisure.darkmode';

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialDarkMode?: boolean }> = ({ children, initialDarkMode = true }) => {
  const [darkMode, setDarkMode] = useState(initialDarkMode);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
          setDarkMode(raw === 'true');
        }
      } catch (error) {
        console.warn('Failed to load dark mode setting', error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, String(darkMode));
      } catch (error) {
        console.warn('Failed to persist dark mode setting', error);
      }
    };
    persist();
  }, [darkMode]);

  const value = useMemo(() => ({
    colors: darkMode ? DarkColors : LightColors,
    darkMode,
    setDarkMode,
    toggleDarkMode: () => setDarkMode(prev => !prev),
  }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

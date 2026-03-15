import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Settings = {
  language: 'English' | 'Filipino';
  avatarColor: string;
};

type SettingsContextValue = {
  settings: Settings;
  setLanguage: (language: Settings['language']) => void;
  setAvatarColor: (color: string) => void;
};

const DEFAULT_SETTINGS: Settings = {
  language: 'English',
  avatarColor: '#638cff',
};

const STORAGE_KEY = 'serbisure.settings';

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  setLanguage: () => {},
  setAvatarColor: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.warn('Failed to load settings', error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to persist settings', error);
      }
    };
    persist();
  }, [settings]);

  const value = useMemo(() => ({
    settings,
    setLanguage: (language: Settings['language']) => setSettings(prev => ({ ...prev, language })),
    setAvatarColor: (color: string) => setSettings(prev => ({ ...prev, avatarColor: color })),
  }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

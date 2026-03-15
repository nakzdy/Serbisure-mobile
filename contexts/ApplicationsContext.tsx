import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { INITIAL_APPLICATIONS } from '../data/mockWorker';
import { useSettings } from './SettingsContext';

export type Application = {
  id: string;
  requestId: string;
  workerName: string;
  serviceType: string;
  date: string;
  homeownerName: string;
  status: 'Applied' | 'Accepted' | 'Declined' | 'Completed';
};

type ApplicationsContextValue = {
  applications: Application[];
  addApplication: (application: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
};

const STORAGE_KEY = 'serbisure.applications';

const ApplicationsContext = createContext<ApplicationsContextValue>({
  applications: [],
  addApplication: () => {},
  updateApplication: () => {},
});

export const ApplicationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        if (settings.mockDataEnabled) {
          setApplications(INITIAL_APPLICATIONS);
          return;
        }
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setApplications(JSON.parse(raw));
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.warn('Failed to load applications', error);
        setApplications(settings.mockDataEnabled ? INITIAL_APPLICATIONS : []);
      }
    };
    load();
  }, [settings.mockDataEnabled]);

  useEffect(() => {
    const persist = async () => {
      try {
        if (settings.mockDataEnabled) return;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      } catch (error) {
        console.warn('Failed to persist applications', error);
      }
    };
    persist();
  }, [applications, settings.mockDataEnabled]);

  const value = useMemo(() => ({
    applications,
    addApplication: (application: Application) => setApplications(prev => [application, ...prev]),
    updateApplication: (id: string, updates: Partial<Application>) =>
      setApplications(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item)),
  }), [applications]);

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
};

export const useApplications = () => useContext(ApplicationsContext);

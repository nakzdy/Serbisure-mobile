import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { HomeownerRequest, INITIAL_REQUESTS } from '../data/requests';
import { useSettings } from './SettingsContext';

type RequestsContextValue = {
  requests: HomeownerRequest[];
  addRequest: (request: HomeownerRequest) => void;
  updateRequest: (id: string, updates: Partial<HomeownerRequest>) => void;
};

const STORAGE_KEY = 'serbisure.requests';

const RequestsContext = createContext<RequestsContextValue>({
  requests: [],
  addRequest: () => {},
  updateRequest: () => {},
});

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<HomeownerRequest[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        if (settings.mockDataEnabled) {
          setRequests(INITIAL_REQUESTS);
          return;
        }
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setRequests(JSON.parse(raw));
        } else {
          setRequests(INITIAL_REQUESTS);
        }
      } catch (error) {
        console.warn('Failed to load requests', error);
        setRequests(INITIAL_REQUESTS);
      }
    };
    load();
  }, [settings.mockDataEnabled]);

  useEffect(() => {
    const persist = async () => {
      try {
        if (settings.mockDataEnabled) return;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
      } catch (error) {
        console.warn('Failed to persist requests', error);
      }
    };
    persist();
  }, [requests, settings.mockDataEnabled]);

  const value = useMemo(() => ({
    requests,
    addRequest: (request: HomeownerRequest) => setRequests(prev => [request, ...prev]),
    updateRequest: (id: string, updates: Partial<HomeownerRequest>) =>
      setRequests(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item)),
  }), [requests]);

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => useContext(RequestsContext);

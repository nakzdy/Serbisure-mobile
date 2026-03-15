import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { INITIAL_BOOKINGS } from '../data/mockWorker';
import { useSettings } from './SettingsContext';

export type Booking = {
  id: string;
  workerId: string;
  workerName: string;
  homeownerName?: string;
  skills: string[];
  reliability: number;
  requestId?: string;
  serviceType?: string;
  serviceDate?: string;
  estimatedCost?: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
};

type BookingsContextValue = {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
};

const STORAGE_KEY = 'serbisure.bookings';

const BookingsContext = createContext<BookingsContextValue>({
  bookings: [],
  addBooking: () => {},
  updateBookingStatus: () => {},
});

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        if (settings.mockDataEnabled) {
          setBookings(INITIAL_BOOKINGS);
          return;
        }
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setBookings(JSON.parse(raw));
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.warn('Failed to load bookings', error);
        setBookings(settings.mockDataEnabled ? INITIAL_BOOKINGS : []);
      }
    };
    load();
  }, [settings.mockDataEnabled]);

  useEffect(() => {
    const persist = async () => {
      try {
        if (settings.mockDataEnabled) return;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
      } catch (error) {
        console.warn('Failed to persist bookings', error);
      }
    };
    persist();
  }, [bookings, settings.mockDataEnabled]);

  const value = useMemo(() => ({
    bookings,
    addBooking: (booking: Booking) => setBookings(prev => [booking, ...prev]),
    updateBookingStatus: (id: string, status: Booking['status']) =>
      setBookings(prev => prev.map(item => item.id === id ? { ...item, status } : item)),
  }), [bookings]);

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => useContext(BookingsContext);

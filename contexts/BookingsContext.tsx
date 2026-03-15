import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setBookings(JSON.parse(raw));
        }
      } catch (error) {
        console.warn('Failed to load bookings', error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
      } catch (error) {
        console.warn('Failed to persist bookings', error);
      }
    };
    persist();
  }, [bookings]);

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

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { INITIAL_BOOKINGS } from '../data/mockWorker';
import { useSettings } from './SettingsContext';
import { bookingsAPI } from '../services/api';

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

        // Try to fetch from Django first
        try {
            const data = await bookingsAPI.getBookings();
            if (Array.isArray(data)) {
                const mapped: Booking[] = data.map((b: any) => ({
                    id: b.id.toString(),
                    workerId: b.service.toString(),
                    workerName: b.service_details?.provider?.full_name || b.service_details?.name || 'Worker',
                    homeownerName: b.homeowner_details?.full_name || b.homeowner_details?.name || b.client_details?.full_name || b.client_details?.name || b.homeowner_name || b.client_name || 'Homeowner',
                    skills: [b.service_details?.category || 'Service'],
                    serviceType: b.service_details?.category || b.service_details?.name || '',
                    serviceDate: b.scheduled_date || b.service_date || b.date || b.createdAt || b.created_at || '',
                    reliability: 90,
                    status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
                    createdAt: b.created_at || new Date().toISOString(),
                }));
                setBookings(mapped);
                return;
            }
        } catch (apiErr) {
            console.warn("Failed to fetch bookings from API, falling back to local storage.");
        }

        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          // Migrate any cached USD currencies to PHP before parsing
          const migratedRaw = raw.replace(/\$(\d+)/g, '₱$1');
          setBookings(JSON.parse(migratedRaw));
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
    updateBookingStatus: async (id: string, status: Booking['status']) => {
      try {
        if (!settings.mockDataEnabled) {
          // API expects lowercase status (e.g. 'completed', 'cancelled')
          await bookingsAPI.updateBooking(id, { status: status.toLowerCase() });
        }
      } catch (err) {
        console.warn('Failed to update booking status', err);
      }
      setBookings(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    },
  }), [bookings]);

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => useContext(BookingsContext);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../constants/Config';

const API_BASE = `${getBaseUrl()}/api/v1`;

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('serbisure_token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return headers;
};

const request = async (endpoint: string, options: RequestInit) => {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return handleResponse(response);
    } catch (err: any) {
        console.warn('API request failed:', err);
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
};

// Global response handler to catch 401/403 Unauthorized errors
const handleResponse = async (response: Response) => {
    if (response.status === 401 || response.status === 403) {
        console.warn("Unauthorized access detected. Clearing session...");
        await AsyncStorage.removeItem('serbisure_token');
    }
    if (response.status === 204) return { status: 'success' };
    return response.json();
};

export const apiService = {
    get: async (endpoint: string) => {
        const headers = await getHeaders();
        return request(endpoint, { method: 'GET', headers });
    },

    post: async (endpoint: string, data: any) => {
        const headers = await getHeaders();
        return request(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
    },

    put: async (endpoint: string, data: any) => {
        const headers = await getHeaders();
        return request(endpoint, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
    },

    patch: async (endpoint: string, data: any) => {
        const headers = await getHeaders();
        return request(endpoint, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
    },

    delete: async (endpoint: string) => {
        const headers = await getHeaders();
        return request(endpoint, { method: 'DELETE', headers });
    },
};

export const authAPI = {
    login: async (credentials: any) => {
        const response = await apiService.post('/auth/login/', credentials);
        if (response.status === 'success' && response.data?.token) {
            await AsyncStorage.setItem('serbisure_token', response.data.token);
        }
        return response;
    },
    register: async (userData: any) => {
        const response = await apiService.post('/auth/register/', userData);
        if (response.status === 'success' && response.data?.token) {
            await AsyncStorage.setItem('serbisure_token', response.data.token);
        }
        return response;
    },
    logout: async () => {
        await AsyncStorage.removeItem('serbisure_token');
    },
    getProfile: async () => {
        return apiService.get('/profile/');
    },
    updateProfile: async (data: any) => {
        return apiService.patch('/profile/', data);
    },
    googleSync: async (userData: any) => {
        const response = await apiService.post('/auth/google-sync/', userData);
        if (response.status === 'success' && response.data?.token) {
            await AsyncStorage.setItem('serbisure_token', response.data.token);
        }
        return response;
    },
};

export const servicesAPI = {
    getServices: async () => {
        const response = await apiService.get('/services/');
        return response.results || response.data || response;
    },
    createService: async (data: any) => {
        return apiService.post('/services/', data);
    },
    updateService: async (id: string | number, data: any) => {
        return apiService.patch(`/services/${id}/`, data);
    },
    deleteService: async (id: string | number) => {
        return apiService.delete(`/services/${id}/`);
    },
};

export const bookingsAPI = {
    getBookings: async () => {
        const response = await apiService.get('/bookings/');
        return response.results || response.data || response;
    },
    createBooking: async (bookingData: any) => {
        return apiService.post('/bookings/', bookingData);
    },
    updateBooking: async (id: string | number, data: any) => {
        return apiService.patch(`/bookings/${id}/`, data);
    },
    deleteBooking: async (id: string | number) => {
        return apiService.delete(`/bookings/${id}/`);
    },
};

import { Platform } from 'react-native';

export const API_CONFIG = {
    // For Android Emulator use 10.0.2.2
    // For iOS Simulator use localhost or 127.0.0.1
    // For Physical Device use your machine's local IP address (e.g., 192.168.1.xxx)
    BASE_URL: 'http://192.168.1.9:8001', // <--- Updated to use new port 8001!
    WEB_URL: 'http://127.0.0.1:8000', // For web browser testing
    PROD_URL: 'https://serbisure-backend.vercel.app',
};

export const getBaseUrl = () => {
    // If running in a web browser, 10.0.2.2 will timeout. Use 127.0.0.1 instead.
    if (Platform.OS === 'web') {
        return API_CONFIG.WEB_URL;
    }
    // If testing on a physical device, you would change this to `http://192.168.1.9:8000`
    return API_CONFIG.BASE_URL;
};

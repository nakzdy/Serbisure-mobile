import { Platform } from "react-native";

export const API_CONFIG = {
  // For Android Emulator use 10.0.2.2
  // For iOS Simulator use localhost or 127.0.0.1
  // For Physical Device use your machine's local IP address (e.g., 192.168.1.xxx)
  BASE_URL: "http://192.168.1.4:8000", // Physical device / local network
  WEB_URL: "http://192.168.1.4:8000", // For web browser testing
  PROD_URL: "https://serbisure-backend.vercel.app",
};

export const getBaseUrl = () => {
  // Web: use local web URL
  if (Platform.OS === "web") {
    return API_CONFIG.WEB_URL;
  }

  // Android: use configured local network IP for physical devices.
  // If you are running on an Android emulator and need host access, change BASE_URL to http://10.0.2.2:8000.
  if (Platform.OS === "android") {
    return API_CONFIG.BASE_URL;
  }

  // iOS simulator uses localhost/127.0.0.1
  if (Platform.OS === "ios") {
    return API_CONFIG.WEB_URL;
  }

  // Physical device / other platforms: use configured BASE_URL (LAN)
  return API_CONFIG.BASE_URL;
};

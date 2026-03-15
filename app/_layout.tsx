import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import * as SystemUI from 'expo-system-ui';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../contexts/ThemeContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { BookingsProvider } from '../contexts/BookingsContext';
import { RequestsProvider } from '../contexts/RequestsContext';
import { ApplicationsProvider } from '../contexts/ApplicationsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const { colors, darkMode } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg1);
  }, [colors.bg1]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login if user is not authenticated
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to tabs if user is authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.bg1,
      card: colors.navBg,
      text: colors.text,
      border: colors.cardBorder,
    },
  };
  const CustomLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg1,
      card: colors.navBg,
      text: colors.text,
      border: colors.cardBorder,
    },
  };

  return (
    <ThemeProvider value={darkMode ? CustomDarkTheme : CustomLightTheme}>
      <Stack>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider initialDarkMode={useColorScheme() !== 'light'}>
      <SettingsProvider>
        <RequestsProvider>
          <ApplicationsProvider>
            <BookingsProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </BookingsProvider>
          </ApplicationsProvider>
        </RequestsProvider>
      </SettingsProvider>
    </AppThemeProvider>
  );
}

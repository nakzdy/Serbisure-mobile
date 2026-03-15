import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { user } = useAuth();
  const isWorker = user?.role === 'worker';
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.navBg,
          borderTopColor: colors.cardBorder,
        },
        headerStyle: {
          backgroundColor: colors.navBg,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
        },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          href: isWorker ? null : '/',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Dashboard',
          href: !isWorker ? null : '/explore',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="grid" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          href: isWorker ? null : '/services',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="construct" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: 'Bookings',
          href: '/bookings',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="calendar" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="applications/index"
        options={{
          title: 'Applications',
          href: isWorker ? '/applications' : null,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="clipboard" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="time" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="settings" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="reviews/index"
        options={{
          title: 'Reviews',
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="worker/[id]"
        options={{
          title: 'Worker Profile',
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

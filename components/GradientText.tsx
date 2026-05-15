import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface GradientTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  colors?: [string, string];
}

/**
 * Renders text with a gradient fill using the app's accent colors.
 * Falls back to theme accent → accentDark gradient by default.
 */
export const GradientText: React.FC<GradientTextProps> = ({ children, style, colors: customColors }) => {
  const { colors } = useTheme();
  const gradientColors = customColors || [colors.accent, colors.accentDark];

  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    type?: 'primary' | 'secondary' | 'outline';
    size?: 'md' | 'sm';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    type = 'primary',
    size = 'md',
    style,
    textStyle,
    disabled
}) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const isPrimary = type === 'primary';

    const touchableStyle = [
        styles.touchable,
        disabled && styles.disabled,
        style
    ];

    const innerStyles = [
        styles.buttonInner,
        size === 'sm' && styles.buttonInnerSmall,
        !isPrimary && styles.button, // Add generic button styles for outlines/secondary
        type === 'secondary' && styles.buttonSecondary,
        type === 'outline' && styles.buttonOutline,
    ];

    const textColor =
        type === 'outline'
            ? colors.accent
            : type === 'secondary'
                ? colors.text
                : colors.textOnAccent;
    const content = (
        <Text style={[
            styles.buttonText,
            size === 'sm' && styles.buttonTextSmall,
            { color: textColor },
            textStyle
        ]}>
            {title}
        </Text>
    );

    return (
        <TouchableOpacity
            style={touchableStyle as ViewStyle[]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {isPrimary ? (
                <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={innerStyles}
                >
                    {content}
                </LinearGradient>
            ) : (
                <View style={innerStyles}>
                    {content}
                </View>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (colors: typeof import('../constants/theme').DarkColors) => StyleSheet.create({
    touchable: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden', // Ensure inner background doesn't bleed out of rounded corners
    },
    buttonInner: {
        width: '100%',
        minHeight: 48,
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonInnerSmall: {
        minHeight: 32,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    buttonSecondary: {
        backgroundColor: colors.cardBgSolid,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.accent,
    },
    buttonText: {
        color: colors.textOnAccent,
        fontSize: 15,
        fontWeight: '600',
    },
    buttonTextSmall: {
        fontSize: 13,
    },
    disabled: {
        opacity: 0.5,
    }
});

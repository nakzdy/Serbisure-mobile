import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';

// --- Input Component ---
interface InputProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    error?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric';
    editable?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    error,
    keyboardType = 'default',
    editable = true
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, error && styles.inputError, secureTextEntry && { paddingRight: 45 }]}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                    editable={editable}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        activeOpacity={0.7}
                    >
                        <Ionicons 
                            name={isPasswordVisible ? 'eye-off' : 'eye'} 
                            size={20} 
                            color={Theme.colors.muted} 
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};


// --- Card Component ---
interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => (
    <View style={[styles.card, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '500', // Changed to match web (500)
        color: Theme.colors.muted,
        marginBottom: 6,
        letterSpacing: 0.4, // Added to match web
        textTransform: 'uppercase',
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    input: {
        backgroundColor: Theme.colors.inputBg,
        borderColor: Theme.colors.inputBorder,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16, // Matched web padding 13px 16px
        paddingVertical: 13,
        color: Theme.colors.text,
        fontSize: 14,
        // (Focus state border color changes are handled via state typically, not just style object)
    },
    inputError: {
        borderColor: Theme.colors.danger,
    },
    errorText: {
        color: Theme.colors.danger,
        fontSize: 12,
        marginTop: 4,
    },
    card: {
        backgroundColor: Theme.colors.cardBg,
        borderRadius: 20,
        padding: 30, // Matched web .glass-card padding
        borderWidth: 1,
        borderColor: Theme.colors.cardBorder, // Approximates --glass-border
        width: '100%',
    }
});

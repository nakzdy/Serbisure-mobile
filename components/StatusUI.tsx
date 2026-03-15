import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// --- Badge Component ---
interface BadgeProps {
    text: string;
    type?: 'primary' | 'success' | 'pending' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ text, type = 'primary' }) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    return (
        <View style={[
            styles.badge,
            type === 'primary' && styles.badge_primary,
            type === 'success' && styles.badge_success,
            type === 'pending' && styles.badge_pending,
            type === 'outline' && styles.badge_outline
        ]}>
            <Text style={[
                styles.badgeText,
                type === 'primary' && styles.badgeText_primary,
                type === 'success' && styles.badgeText_success,
                type === 'pending' && styles.badgeText_pending,
                type === 'outline' && styles.badgeText_outline
            ]}>{text}</Text>
        </View>
    );
};

// --- StatusIndicator Component ---
interface StatusProps {
    status: 'online' | 'offline' | 'pending';
}

export const StatusIndicator: React.FC<StatusProps> = ({ status }) => (
    <StatusIndicatorInner status={status} />
);

const StatusIndicatorInner: React.FC<StatusProps> = ({ status }) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    return (
        <View style={styles.statusContainer}>
            <View style={[styles.statusDot, styles[`dot_${status}` as keyof typeof styles] as any]} />
            <Text style={styles.statusText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
        </View>
    );
};

const createStyles = (colors: typeof import('../constants/theme').DarkColors) => StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20, // Match .system-status-badge
        alignSelf: 'flex-start',
        borderWidth: 1, // Web badge has border
        maxWidth: 120,
    },
    badge_primary: {
        backgroundColor: 'rgba(99, 140, 255, 0.15)',
        borderColor: 'rgba(99, 140, 255, 0.25)',
    },
    badge_outline: {
        backgroundColor: 'transparent',
        borderColor: colors.cardBorder,
    },
    badge_success: {
        backgroundColor: 'rgba(76, 209, 55, 0.15)',
        borderColor: 'rgba(76, 209, 55, 0.25)',
    },
    badge_pending: {
        backgroundColor: colors.statusPending,
        // Using accent as default fallback for pending border since statusPendingBorder isn't in Theme yet
        borderColor: colors.accent,
    },
    badgeText: {
        fontSize: 12, // Match .system-status-badge
        fontWeight: '600',
        flexShrink: 1,
        textAlign: 'center',
    },
    badgeText_primary: { color: colors.accent },
    badgeText_outline: { color: colors.textMuted },
    badgeText_success: { color: colors.success },
    badgeText_pending: { color: colors.statusPendingText },

    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    dot_online: { backgroundColor: colors.success },
    dot_offline: { backgroundColor: colors.muted },
    dot_pending: { backgroundColor: colors.statusPendingText },
    statusText: {
        color: colors.textMuted,
        fontSize: 13,
    }
});

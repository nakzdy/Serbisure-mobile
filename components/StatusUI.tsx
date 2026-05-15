import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// --- Badge Component ---
interface BadgeProps {
    text: string;
    type?: 'primary' | 'success' | 'pending' | 'outline' | 'warning' | 'awaiting';
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
            type === 'outline' && styles.badge_outline,
            type === 'warning' && styles.badge_warning,
            type === 'awaiting' && styles.badge_awaiting,
        ]}>
            <Text style={[
                styles.badgeText,
                type === 'primary' && styles.badgeText_primary,
                type === 'success' && styles.badgeText_success,
                type === 'pending' && styles.badgeText_pending,
                type === 'outline' && styles.badgeText_outline,
                type === 'warning' && styles.badgeText_warning,
                type === 'awaiting' && styles.badgeText_awaiting,
            ]} numberOfLines={1}>{text}</Text>
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
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
    },
    badge_primary: {
        backgroundColor: colors.statusPending,
        borderColor: colors.statusPendingBorder,
    },
    badge_outline: {
        backgroundColor: 'transparent',
        borderColor: colors.cardBorder,
    },
    badge_success: {
        backgroundColor: `${colors.success}1A`,
        borderColor: `${colors.success}40`,
    },
    badge_pending: {
        backgroundColor: colors.statusPending,
        borderColor: colors.statusPendingBorder,
    },
    badge_warning: {
        backgroundColor: colors.warningBg,
        borderColor: colors.warningBorder,
    },
    badge_awaiting: {
        backgroundColor: colors.awaitingBg,
        borderColor: colors.awaitingBorder,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    badgeText_primary: { color: colors.accent },
    badgeText_outline: { color: colors.textMuted },
    badgeText_success: { color: colors.success },
    badgeText_pending: { color: colors.statusPendingText },
    badgeText_warning: { color: colors.warning },
    badgeText_awaiting: { color: colors.awaitingText },

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

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/CommonUI';
import AppModal from '../../../components/Modal';
import { Badge } from '../../../components/StatusUI';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookings } from '../../../contexts/BookingsContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function HistoryScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const { bookings } = useBookings();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'All' | 'Completed' | 'Cancelled'>('All');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const insets = useSafeAreaInsets();

    const isWorker = user?.role === 'worker';
    const workerName = user?.name || '';

    const historyItems = useMemo(() => {
        const list = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');
        const scoped = isWorker ? list.filter(b => !workerName || b.workerName === workerName) : list;
        return scoped.map(item => ({
            id: item.id,
            title: item.skills?.[0] || 'Service Request',
            category: (item.skills && item.skills.length > 0) ? item.skills.join(', ') : 'Service Request',
            worker: item.workerName || 'Worker',
            homeowner: item.homeownerName || 'Homeowner',
            date: item.createdAt || 'TBD',
            stars: item.status === 'Completed' ? 5 : 0,
            status: item.status,
        }));
    }, [bookings, isWorker, workerName]);

    const filteredHistory = useMemo(() => {
        if (activeTab === 'All') return historyItems;
        return historyItems.filter(item => item.status === activeTab);
    }, [activeTab, historyItems]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: 100 }]}
        >
            <AppModal
                visible={!!selectedItem}
                title="Service Details"
                onClose={() => setSelectedItem(null)}
                actions={[{ label: 'Close', type: 'secondary' }]}
            >
                {selectedItem && (
                    <View style={styles.modalBlock}>
                        <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                        <Text style={styles.modalLine}>Category: {selectedItem.category}</Text>
                        <Text style={styles.modalLine}>{isWorker ? `Homeowner: ${selectedItem.homeowner}` : `Worker: ${selectedItem.worker}`}</Text>
                        <Text style={styles.modalLine}>Date: {selectedItem.date}</Text>
                        <Text style={styles.modalLine}>Status: {selectedItem.status}</Text>
                    </View>
                )}
            </AppModal>

            <View style={styles.header}>
                <Text style={styles.title}>Service History</Text>
                <Text style={styles.subtitle}>
                    {isWorker ? 'Review completed and cancelled jobs' : 'View your past bookings and completed services'}
                </Text>
            </View>

            <View style={styles.summaryStats}>
                <Card style={styles.statCard}>
                    <Text style={styles.statScore}>{historyItems.length}</Text>
                    <Text style={styles.statLabel}>TOTAL RECORDS</Text>
                </Card>
                <Card style={styles.statCard}>
                    <Text style={styles.statScore}>{historyItems.filter(item => item.status === 'Completed').length}</Text>
                    <Text style={styles.statLabel}>COMPLETED</Text>
                </Card>
            </View>

            <View style={styles.tabsWrapper}>
                <View style={styles.statusTabs}>
                    {(['All', 'Completed', 'Cancelled'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            activeOpacity={0.7}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                        >
                            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.list}>
                {filteredHistory.map(item => (
                    <TouchableOpacity key={item.id} activeOpacity={0.8} onPress={() => setSelectedItem(item)}>
                        <Card style={styles.historyCard}>
                            <View style={styles.reqTop}>
                                <View style={styles.iconBox}>
                                    <Text style={styles.iconSymbol}>*</Text>
                                </View>
                                <View style={styles.infoCol}>
                                    <View style={styles.reqTitleRow}>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        <View style={styles.reqStatus}>
                                            <Badge type={(item.status === 'Completed' ? 'primary' : 'outline') as any} text={item.status} />
                                        </View>
                                    </View>
                                    <Text style={styles.itemCategory}>
                                        {item.category} • {isWorker ? item.homeowner : item.worker}
                                    </Text>
                                    <View style={styles.reqDetailsRow}>
                                        <Text style={styles.itemMeta}>Requested: {item.date}</Text>
                                        {item.stars > 0 ? (
                                            <Text style={styles.ratingStars}>{'*****'.slice(0, item.stars)}</Text>
                                        ) : (
                                            <Text style={styles.noRating}>No rating</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
                {filteredHistory.length === 0 && (
                    <Card style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No history yet.</Text>
                    </Card>
                )}
            </View>
        </ScrollView>
    );
}

const createStyles = (colors: typeof import('../../../constants/theme').DarkColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
    },
    summaryStats: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 24,
    },
    statScore: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.accent,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        letterSpacing: 1,
    },
    tabsWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    statusTabs: {
        flexDirection: 'row',
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        padding: 4,
        gap: 4,
        width: '100%',
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBtnActive: {
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    tabBtnText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    tabBtnTextActive: {
        color: colors.text,
    },
    list: {
        marginBottom: 40,
    },
    historyCard: {
        padding: 0,
        marginBottom: 16,
        overflow: 'hidden',
        borderRadius: 16,
    },
    reqTop: {
        flexDirection: 'row',
        padding: 20,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 10,
        backgroundColor: colors.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconSymbol: {
        fontSize: 20,
        color: colors.textMuted,
    },
    infoCol: {
        flex: 1,
    },
    reqTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
        gap: 8,
    },
    itemTitle: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    reqStatus: {
        flexShrink: 0,
    },
    itemCategory: {
        color: colors.textMuted,
        fontSize: 13,
        marginBottom: 8,
    },
    reqDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemMeta: {
        color: colors.textMuted,
        fontSize: 12,
    },
    ratingStars: {
        color: colors.accent,
        fontSize: 14,
        letterSpacing: 2,
    },
    noRating: {
        color: colors.textMuted,
        fontSize: 12,
    },
    modalBlock: {
        gap: 8,
    },
    modalTitle: {
        color: colors.text,
        fontWeight: '700',
        fontSize: 16,
    },
    modalLine: {
        color: colors.textMuted,
        fontSize: 13,
    },
    emptyCard: {
        padding: 20,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 13,
    },
});

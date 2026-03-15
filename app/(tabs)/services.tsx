import { Redirect, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/CommonUI';
import AppModal from '../../components/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingsContext';
import { useRequests } from '../../contexts/RequestsContext';
import { WORKERS } from '../../data/workers';

export default function ServicesScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const params = useLocalSearchParams<{ book?: string }>();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [bookingWorker, setBookingWorker] = useState<typeof WORKERS[0] | null>(null);
    const [infoModal, setInfoModal] = useState({ visible: false, title: '', message: '' });
    const { bookings, addBooking } = useBookings();
    const { addRequest } = useRequests();
    const insets = useSafeAreaInsets();

    const filteredWorkers = useMemo(() => {
        const matchCategory = (worker: typeof WORKERS[0]) =>
            selectedCategory === 'All' || worker.skills.some(skill => skill.toLowerCase().includes(selectedCategory.toLowerCase()));
        const matchSearch = (worker: typeof WORKERS[0]) =>
            worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            worker.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
        return WORKERS.filter(worker => matchCategory(worker) && matchSearch(worker));
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        if (params.book) {
            const worker = WORKERS.find(w => w.id === params.book);
            if (worker) {
                setBookingWorker(worker);
            }
        }
    }, [params.book]);

    const handleBookService = (workerId: string, workerName: string, skills: string[], reliability: number) => {
        const alreadyBooked = bookings.some(b => b.workerId === workerId && b.status !== 'Cancelled');
        if (alreadyBooked) return;
        const requestId = `req-${Date.now()}`;
        addRequest({
            id: requestId,
            title: skills[0] || 'Service Request',
            category: skills[0] || 'General',
            date: new Date().toLocaleString(),
            est: 'TBD',
            homeownerName: user?.name || 'Homeowner',
            status: 'Confirmed',
        });
        addBooking({
            id: `${workerId}-${Date.now()}`,
            workerId,
            workerName,
            homeownerName: user?.name || 'Homeowner',
            skills,
            reliability,
            requestId,
            serviceType: skills[0] || 'Service Request',
            serviceDate: new Date().toLocaleString(),
            estimatedCost: 'TBD',
            createdAt: new Date().toLocaleString(),
            status: 'Confirmed',
        });
        setBookingWorker(null);
        setInfoModal({ visible: true, title: 'Booking Confirmed', message: `Your booking with ${workerName} is confirmed and appears in Active Requests.` });
        router.push('/(tabs)/bookings');
    };

    if (user?.role === 'worker') {
        return <Redirect href="/(tabs)/explore" />;
    }

    const renderWorker = (item: typeof WORKERS[0]) => (
        <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/worker/[id]', params: { id: item.id } })} activeOpacity={0.8}>
            <Card style={styles.workerCard}>
                <View style={styles.workerHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.name[0]}</Text>
                    </View>
                    <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{item.name}</Text>
                        <View style={styles.verifiedRow}>
                            {item.verified ? (
                                <Text style={styles.verifiedText}>Verified</Text>
                            ) : (
                                <Text style={styles.pendingText}>Pending</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.reliabilityBadge}>
                        <Text style={styles.reliabilityScore}>{item.reliability}%</Text>
                        <Text style={styles.reliabilityLabel}>RELIABILITY</Text>
                    </View>
                </View>

                <View style={styles.skillsRow}>
                    {item.skills.map(skill => (
                        <View key={skill} style={styles.skillBadge}>
                            <Text style={styles.skillText}>{skill}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.tesdaRow}>
                    {item.tesda ? (
                        <Text style={styles.tesdaText}>TESDA Certified</Text>
                    ) : (
                        <Text style={styles.noTesdaText}>No TESDA Certificate</Text>
                    )}
                </View>

                <Button
                    title={bookings.some(b => b.workerId === item.id && b.status !== 'Cancelled') ? 'Booked' : 'Book Service'}
                    onPress={() => setBookingWorker(item)}
                    style={styles.bookButton}
                    disabled={bookings.some(b => b.workerId === item.id && b.status !== 'Cancelled')}
                />
            </Card>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: 100 }]}
        >
            <AppModal
                visible={infoModal.visible}
                title={infoModal.title}
                message={infoModal.message}
                onClose={() => setInfoModal(prev => ({ ...prev, visible: false }))}
            />
            <AppModal
                visible={!!bookingWorker}
                title="Confirm Booking"
                onClose={() => setBookingWorker(null)}
                actions={[
                    { label: 'Confirm', type: 'primary', onPress: () => bookingWorker && handleBookService(bookingWorker.id, bookingWorker.name, bookingWorker.skills, bookingWorker.reliability) },
                    { label: 'Cancel', type: 'secondary' },
                ]}
            >
                {bookingWorker && (
                    <View style={styles.modalBlock}>
                        <Text style={styles.modalTitle}>Book {bookingWorker.name}</Text>
                        <Text style={styles.modalLine}>Service types: {bookingWorker.skills.join(', ')}</Text>
                        <Text style={styles.modalLine}>Reliability score: {bookingWorker.reliability}%</Text>
                        <Text style={styles.modalLine}>We will confirm your schedule after the worker accepts.</Text>
                    </View>
                )}
            </AppModal>

            <View style={styles.header}>
                <Text style={styles.title}>Browse Services</Text>
                <Text style={styles.subtitle}>Find and book verified service providers for your home</Text>
                <View style={styles.headerActions}>
                    <Button title="View Bookings" type="outline" onPress={() => router.push('/(tabs)/bookings')} />
                </View>
            </View>

            <View style={styles.searchSection}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search by name or skill..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.section}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                    {['All', 'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Babysitting', 'Pet Care', 'General Help'].map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryBadge, selectedCategory === cat && styles.categoryActive]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryActiveText]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.gridSection}>
                {filteredWorkers.length > 0 ? (
                    filteredWorkers.map(worker => (
                        <View key={worker.id} style={styles.gridItem}>
                            {renderWorker(worker)}
                        </View>
                    ))
                ) : (
                    <Text style={styles.noResults}>No workers found for '{selectedCategory}'.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const createStyles = (colors: typeof import('../../constants/theme').DarkColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 24,
    },
    headerActions: {
        marginTop: 12,
        maxWidth: 180,
    },
    title: {
        color: colors.text,
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: 14,
    },
    searchSection: {
        marginBottom: 20,
    },
    searchBar: {
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 8,
        padding: 14,
        color: colors.text,
    },
    section: {
        marginBottom: 24,
    },
    categories: {
        flexDirection: 'row',
    },
    categoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.cardBg,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    categoryActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    categoryText: {
        color: colors.textMuted,
        fontWeight: '600',
        fontSize: 13,
    },
    categoryActiveText: {
        color: colors.textOnAccent,
    },
    gridSection: {
        marginBottom: 40,
    },
    gridItem: {
        marginBottom: 16,
    },
    workerCard: {
        padding: 20,
        borderRadius: 12,
    },
    workerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.cardBgSolid,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: colors.textMuted,
        fontSize: 20,
        fontWeight: '700',
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    verifiedText: {
        color: colors.accent,
        fontSize: 12,
        fontWeight: '600',
    },
    pendingText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    reliabilityBadge: {
        alignItems: 'flex-end',
    },
    reliabilityScore: {
        color: colors.accent,
        fontSize: 22,
        fontWeight: '700',
    },
    reliabilityLabel: {
        color: colors.textMuted,
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 6,
    },
    skillBadge: {
        backgroundColor: colors.statusPending,
        borderWidth: 1,
        borderColor: colors.statusPendingBorder,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    skillText: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '500',
    },
    tesdaRow: {
        marginBottom: 20,
    },
    tesdaText: {
        color: colors.accent,
        fontSize: 12,
        fontWeight: '600',
    },
    noTesdaText: {
        color: colors.muted,
        fontSize: 12,
    },
    bookButton: {
        width: '100%',
    },
    noResults: {
        color: colors.textMuted,
        textAlign: 'center',
        paddingVertical: 32,
        fontSize: 14,
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
});

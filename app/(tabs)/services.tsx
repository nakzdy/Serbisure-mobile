import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/CommonUI';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// Mock data matching the "Browse Services" screenshot
const MOCK_WORKERS = [
    { id: '1', name: "Juana Dela Cruz", skills: ["Plumbing", "Pipes", "Drainage"], status: "online", reliability: 92, verified: true, tesda: true },
    { id: '2', name: "Mario Rossi", skills: ["Electrical", "Wiring", "Lighting"], status: "online", reliability: 85, verified: true, tesda: false },
    { id: '3', name: "Maria Clara", skills: ["Cleaning", "Janitorial"], status: "pending", reliability: 60, verified: false, tesda: true },
    { id: '4', name: "Roberto G.", skills: ["Carpentry", "Furniture", "Repair"], status: "online", reliability: 95, verified: true, tesda: true },
    { id: '5', name: "Elena R.", skills: ["Babysitting", "Child Care"], status: "online", reliability: 88, verified: true, tesda: false },
    { id: '6', name: "Paolo M.", skills: ["Pet Care", "Dog Walking"], status: "pending", reliability: 78, verified: false, tesda: false },
];

export default function ServicesScreen() {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [bookedWorkerId, setBookedWorkerId] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const filteredWorkers = selectedCategory === 'All'
        ? MOCK_WORKERS
        : MOCK_WORKERS.filter(w => w.skills.some(skill => skill.toLowerCase().includes(selectedCategory.toLowerCase())));

    const handleBookService = (workerId: string, workerName: string) => {
        if (bookedWorkerId === workerId) {
            Alert.alert('Already Booked', `${workerName} is already in your requests.`);
            return;
        }
        setBookedWorkerId(workerId);
        Alert.alert('Service Booked', `You have requested ${workerName}. We sent a confirmation email.`);
    };

    const handleSearch = () => {
        Alert.alert('Search', 'Search by name or skill is coming soon.');
    };

    const handleViewWorkerDetails = (workerName: string) => {
        Alert.alert('Worker Details', `Opening profile for ${workerName} (demo placeholder).`);
    };

    if (user?.role === 'worker') {
        return <Redirect href="/(tabs)/explore" />;
    }

    const renderWorker = ({ item }: { item: typeof MOCK_WORKERS[0] }) => (
        <TouchableOpacity onPress={() => handleViewWorkerDetails(item.name)} activeOpacity={0.8}>
            <Card style={styles.workerCard}>
                <View style={styles.workerHeader}>
                    <View style={styles.avatarPlaceholder}>
                        {/* The screenshot shows a grey generic bust, we will use a muted placeholder with an icon or initials */}
                        <Text style={styles.avatarText}>{item.name[0]}</Text>
                    </View>
                <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{item.name}</Text>
                    <View style={styles.verifiedRow}>
                        {item.verified ? (
                            <Text style={styles.verifiedText}>✔ Verified</Text>
                        ) : (
                            <Text style={styles.pendingText}>◷ Pending</Text>
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
                    <Text style={styles.tesdaText}>🏅 TESDA Certified</Text>
                ) : (
                    <Text style={styles.noTesdaText}>— No TESDA Certificate</Text>
                )}
            </View>

            <Button
                title={bookedWorkerId === item.id ? 'Booked' : 'Book Service'}
                onPress={() => handleBookService(item.id, item.name)}
                style={styles.bookButton}
                disabled={bookedWorkerId === item.id}
            />
        </Card>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: 100 }]}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Browse Services</Text>
                <Text style={styles.subtitle}>Find and book verified service providers for your home</Text>
            </View>

            <View style={styles.searchSection}>
                {/* We will mock a search bar look alike the screenshot */}
                <TouchableOpacity style={styles.searchBar} onPress={handleSearch} activeOpacity={0.7}>
                    <Text style={styles.searchPlaceholder}>Search by name or skill...</Text>
                </TouchableOpacity>
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
                            {renderWorker({ item: worker })}
                        </View>
                    ))
                ) : (
                    <Text style={styles.noResults}>No workers found for '{selectedCategory}'.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.bg1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        color: Theme.colors.text,
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        color: Theme.colors.textMuted,
        fontSize: 14,
    },
    searchSection: {
        marginBottom: 20,
    },
    searchBar: {
        backgroundColor: Theme.colors.inputBg,
        borderWidth: 1,
        borderColor: Theme.colors.inputBorder,
        borderRadius: 8,
        padding: 14,
    },
    searchPlaceholder: {
        color: Theme.colors.muted,
        fontSize: 14,
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
        backgroundColor: Theme.colors.cardBg,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Theme.colors.cardBorder,
    },
    categoryActive: {
        backgroundColor: Theme.colors.accent,
        borderColor: Theme.colors.accent,
    },
    categoryText: {
        color: Theme.colors.textMuted,
        fontWeight: '600',
        fontSize: 13,
    },
    categoryActiveText: {
        color: '#FFF',
    },
    gridSection: {
        // In mobile, we just stack them vertically instead of a real grid
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
        backgroundColor: Theme.colors.cardBgSolid, // Muted grey like the screenshot
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: Theme.colors.textMuted,
        fontSize: 20,
        fontWeight: '700',
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        color: Theme.colors.text,
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
        color: Theme.colors.accent,
        fontSize: 12,
        fontWeight: '600',
    },
    pendingText: {
        color: Theme.colors.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    reliabilityBadge: {
        alignItems: 'flex-end',
    },
    reliabilityScore: {
        color: Theme.colors.accent,
        fontSize: 22,
        fontWeight: '700',
    },
    reliabilityLabel: {
        color: Theme.colors.textMuted,
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
        backgroundColor: 'rgba(99, 140, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(99, 140, 255, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    skillText: {
        color: Theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '500',
    },
    tesdaRow: {
        marginBottom: 20,
    },
    tesdaText: {
        color: Theme.colors.accent,
        fontSize: 12,
        fontWeight: '600',
    },
    noTesdaText: {
        color: Theme.colors.muted,
        fontSize: 12,
    },
    bookButton: {
        width: '100%',
    },
    noResults: {
        color: Theme.colors.textMuted,
        textAlign: 'center',
        paddingVertical: 32,
        fontSize: 14,
    }
});

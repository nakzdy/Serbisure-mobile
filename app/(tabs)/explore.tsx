import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/CommonUI';
import AppModal from '../../components/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingsContext';
import { useRequests } from '../../contexts/RequestsContext';
import { useApplications } from '../../contexts/ApplicationsContext';
import { REVIEWS } from '../../data/reviews';

// Mock Data
const MOCK_STATS = [
  { id: '1', label: 'Profile Views', value: '124' },
  { id: '2', label: 'Rating', value: '4.9', suffix: '/5.0' },
  { id: '3', label: 'Jobs Done', value: '34' },
  { id: '4', label: 'Response', value: '98%' },
];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { bookings } = useBookings();
  const { requests } = useRequests();
  const { applications } = useApplications();
  const [isOnline, setIsOnline] = useState(true);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const insets = useSafeAreaInsets();

  const openModal = (title: string, message: string) => setModal({ visible: true, title, message });
  const closeModal = () => setModal(prev => ({ ...prev, visible: false }));

  const workerName = user?.name || 'Worker';
  const openRequests = requests.filter(r => r.status === 'Open');
  const appliedRequestIds = applications.filter(a => a.workerName === workerName).map(a => a.requestId);
  const incomingCount = openRequests.filter(r => !appliedRequestIds.includes(r.id)).length;
  const hasMatch = workerName ? bookings.some(b => b.workerName === workerName) : false;
  const assignedBookings = hasMatch ? bookings.filter(b => b.workerName === workerName) : bookings;
  const activeJobsCount = assignedBookings.filter(b => b.status === 'Confirmed').length;
  const completedCount = assignedBookings.filter(b => b.status === 'Completed').length;

  if (user?.role === 'homeowner') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}>
      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
      <View style={styles.headerArea}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Gerald'}!</Text></Text>
          <Text style={styles.greetingSub}>Here's what's happening today.</Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>{isOnline ? 'Online & Available' : 'Offline'}</Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: colors.cardBorder, true: colors.accent }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statsRow}>
          {MOCK_STATS.map(stat => (
            <Card key={stat.id} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.statValRow}>
                <Text style={styles.statVal}>{stat.value}</Text>
                {stat.suffix && <Text style={styles.statSuffix}>{stat.suffix}</Text>}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <View style={styles.mainGrid}>
        <View style={styles.col}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workflow Overview</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Track new requests, active jobs, and your applications in one place.
          </Text>

          <View style={styles.overviewGrid}>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Incoming Requests</Text>
              <Text style={styles.overviewValue}>{incomingCount}</Text>
              <Text style={styles.overviewHint}>Apply from the Bookings tab.</Text>
              <Button title="View Requests" size="sm" onPress={() => router.push('/(tabs)/bookings')} />
            </Card>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Active Jobs</Text>
              <Text style={styles.overviewValue}>{activeJobsCount}</Text>
              <Text style={styles.overviewHint}>Confirmed work in progress.</Text>
              <Button title="Manage Jobs" size="sm" onPress={() => router.push('/(tabs)/bookings')} />
            </Card>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>My Applications</Text>
              <Text style={styles.overviewValue}>{appliedRequestIds.length}</Text>
              <Text style={styles.overviewHint}>Waiting for homeowner response.</Text>
              <Button title="Review Applications" size="sm" onPress={() => router.push('/(tabs)/applications')} />
            </Card>
            <Card style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Completed Jobs</Text>
              <Text style={styles.overviewValue}>{completedCount}</Text>
              <Text style={styles.overviewHint}>See full history anytime.</Text>
              <Button title="View History" size="sm" onPress={() => router.push('/(tabs)/history')} />
            </Card>
          </View>
        </View>

        <View style={styles.col}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <Text style={styles.viewLink} onPress={() => router.push('/(tabs)/reviews')}>See All</Text>
          </View>

          <Card style={styles.reviewsCard}>
            {(REVIEWS || []).slice(0, 2).map((review, i) => (
              <View key={review.id}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.reviewStars}>*****</Text>
                </View>
                <Text style={styles.reviewBody}>{review.body}</Text>
                <Text style={styles.reviewTime}>{review.time}</Text>
                {i < (REVIEWS || []).slice(0, 2).length - 1 && <View style={styles.reviewDivider} />}
              </View>
            ))}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof import('../../constants/theme').DarkColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg1,
    paddingHorizontal: 20,
  },
  headerArea: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
    backgroundColor: colors.cardBg,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '600',
    flexWrap: 'wrap',
    letterSpacing: -0.5,
  },
  userName: {
    fontWeight: '800',
  },
  greetingSub: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 6,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  toggleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  statsScroll: {
    marginBottom: 24,
    overflow: 'visible',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    width: 140,
    padding: 20,
    paddingVertical: 24,
    borderRadius: 12,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statVal: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  statSuffix: {
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: 4,
  },
  mainGrid: {
    flexDirection: 'column',
    gap: 24,
  },
  col: {
    flex: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  viewLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  overviewGrid: {
    gap: 16,
  },
  overviewCard: {
    padding: 20,
    gap: 8,
  },
  overviewLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overviewValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  overviewHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  reviewsCard: {
    padding: 24,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  reviewStars: {
    color: '#F6AD55',
    fontSize: 14,
    letterSpacing: 2,
  },
  reviewBody: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewTime: {
    color: colors.muted,
    fontSize: 12,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 16,
  },
  emptyCard: {
    padding: 20,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});

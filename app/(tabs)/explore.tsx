import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/CommonUI';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// Mock Data
const MOCK_STATS = [
  { id: '1', label: 'Profile Views', value: '124' },
  { id: '2', label: 'Rating', value: '4.9', suffix: '/5.0' },
  { id: '3', label: 'Jobs Done', value: '34' },
  { id: '4', label: 'Response', value: '98%' },
];

const MOCK_INCOMING = [
  {
    id: '1',
    category: 'Carpentry',
    title: 'Kitchen Cabinet Repair',
    when: 'Tomorrow, 9:00 AM (Standard)',
    where: '4.5 km away',
    client: 'Roberto G.',
    location: 'Don Antonio, QC'
  }
];

const MOCK_REVIEWS = [
  { id: '1', name: 'Alex M.', rating: 5, time: '2 days ago', body: '"Very professional and fixed the leak quickly!"' },
  { id: '2', name: 'David L.', rating: 5, time: '1 week ago', body: '"Good work, but arrived 10 mins late."' },
];

const MOCK_ACTIVE = [
  { id: '1', category: 'Carpentry', title: 'Custom Bookshelf Build' }
];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [acceptedJobs, setAcceptedJobs] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const handleAcceptJob = (id: string) => {
    if (acceptedJobs.includes(id)) {
      Alert.alert('Notice', 'You already accepted this request.');
      return;
    }
    setAcceptedJobs(prev => [...prev, id]);
    Alert.alert('Job Accepted', 'Great job! You have scheduled this request.');
  };

  const handleDeclineJob = (id: string) => {
    Alert.alert('Request Declined', 'This request was declined. You can choose another job.');
    setAcceptedJobs(prev => prev.filter(item => item !== id));
  };

  if (user?.role === 'homeowner') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}>
      {/* Replicating .dashboard-welcome for workers */}
      <View style={styles.headerArea}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Gerald'}!</Text></Text>
          <Text style={styles.greetingSub}>Here's what's happening today.</Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Online & Available</Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#4A5568', true: '#4C6EF5' }}
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
        {/* Left Column Equivalent */}
        <View style={styles.col}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Incoming Requests (1)</Text>
            <Text style={styles.viewLink} onPress={() => Alert.alert('History', 'Redirecting to your completed jobs.')}>View History</Text>
          </View>

          {MOCK_INCOMING.map(req => (
            <Card key={req.id} style={styles.reqCard}>
              <View style={styles.reqBadge}><Text style={styles.reqBadgeText}>{req.category}</Text></View>
              <Text style={styles.reqTitle}>{req.title}</Text>

              <View style={styles.reqDetails}>
                <Text style={styles.reqDetailRow}>📅  When: {req.when}</Text>
                <Text style={styles.reqDetailRow}>📍  Where: {req.where}</Text>
              </View>

              <View style={styles.clientRow}>
                <View style={styles.clientAvatar}><Text style={styles.clientAvatarText}>{req.client[0]}</Text></View>
                <View>
                  <Text style={styles.clientName}>{req.client}</Text>
                  <Text style={styles.clientLoc}>{req.location}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Text
                  style={styles.declineText}
                  onPress={() => handleDeclineJob(req.id)}
                >
                  Decline
                </Text>
                <Button
                  title={acceptedJobs.includes(req.id) ? 'Accepted' : 'Accept Job'}
                  size="sm"
                  onPress={() => handleAcceptJob(req.id)}
                  style={styles.acceptBtn}
                  disabled={acceptedJobs.includes(req.id)}
                />
              </View>
            </Card>
          ))}

          <View style={styles.activeSection}>
            <Text style={styles.sectionTitle}>Active Jobs (1)</Text>
            {MOCK_ACTIVE.map(job => (
              <Card key={job.id} style={styles.activeCard}>
                <View style={styles.activeIndicator} />
                <View style={styles.activeContent}>
                  <Text style={styles.activeCat}>{job.category}</Text>
                  <Text style={styles.activeTitle}>{job.title}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Right Column Equivalent */}
        <View style={styles.col}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <Text style={styles.viewLink} onPress={() => Alert.alert('See All', 'Opening all reviews in a new view.')}>See All</Text>
          </View>

          <Card style={styles.reviewsCard}>
            {MOCK_REVIEWS.map((review, i) => (
              <View key={review.id}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.reviewStars}>★★★★★</Text>
                </View>
                <Text style={styles.reviewBody}>{review.body}</Text>
                <Text style={styles.reviewTime}>{review.time}</Text>
                {i < MOCK_REVIEWS.length - 1 && <View style={styles.reviewDivider} />}
              </View>
            ))}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bg1,
    paddingHorizontal: 20,
  },
  headerArea: {
    flexDirection: 'column', // Stacking for mobile 
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
    backgroundColor: Theme.colors.cardBg,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '600',
    flexWrap: 'wrap',
    letterSpacing: -0.5,
  },
  userName: {
    fontWeight: '800',
  },
  greetingSub: {
    color: Theme.colors.textMuted,
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
    color: '#FFF',
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
    width: 140, // Fixed width for horizontal scrolling
    padding: 20,
    paddingVertical: 24,
    borderRadius: 12,
  },
  statLabel: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statVal: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
  },
  statSuffix: {
    color: Theme.colors.textMuted,
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
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  viewLink: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reqCard: {
    padding: 28,
  },
  reqBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  reqBadgeText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  reqTitle: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 16,
    flexWrap: 'wrap',
    letterSpacing: -0.3,
  },
  reqDetails: {
    marginBottom: 24,
    gap: 8,
    flexWrap: 'wrap',
  },
  reqDetailRow: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    flexWrap: 'wrap',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  clientAvatarText: {
    color: '#FFF',
    fontWeight: '700',
  },
  clientName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientLoc: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  declineText: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    padding: 10,
  },
  acceptBtn: {
    flex: 1,
    minWidth: 100,
  },
  activeSection: {
    marginTop: 24,
  },
  activeCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  activeIndicator: {
    width: 4,
    backgroundColor: '#F6AD55', // Orange indicator like in the screenshot
  },
  activeContent: {
    padding: 20,
  },
  activeCat: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  activeTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  reviewStars: {
    color: '#F6AD55', // Orange stars
    fontSize: 14,
    letterSpacing: 2,
  },
  reviewBody: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: 16,
  }
});

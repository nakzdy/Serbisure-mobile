import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/CommonUI';
import { Badge } from '../../components/StatusUI';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// Mock Data
const MOCK_REQUESTS = [
  { id: '1', title: "Pipe Repair", category: "Plumbing • Emergency", time: "Today, 2:00 PM", est: "$85", status: "Pending Approval", worker: "Marcus J.", rating: "4.9 (120 reviews)" },
  { id: '2', title: "Fixture Installation", category: "Electrical • Standard", time: "Tomorrow, 10:00 AM", est: "$120", status: "Pending Worker", isSearching: true },
  { id: '3', title: "Deep Cleaning", category: "Cleaning • Home", time: "Oct 24, 9:00 AM", est: "$150", status: "Awaiting Confirmation", worker: "Sarah L.", rating: "4.8 (85 reviews)" }
];

const MOCK_TOP_RATED = [
  { id: '1', name: 'James Wilson', role: 'HVAC Specialist', rating: '5', rel: '96%' },
  { id: '2', name: 'Elena Rodriguez', role: 'Interior Designer', rating: '4.9', rel: '96%' },
  { id: '3', name: 'Mike Chen', role: 'General Handyman', rating: '4.2', rel: 'Below threshold' },
];

export default function HomeownerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Pending');
  const [reliabilityFilter, setReliabilityFilter] = useState('All Workers');
  const insets = useSafeAreaInsets();

  const handleShowDetails = (reqTitle: string) => {
    Alert.alert('Details', `Showing details for ${reqTitle}.`);
  };

  const handleCancelRequest = (reqTitle: string) => {
    Alert.alert('Request Cancelled', `${reqTitle} was cancelled. If you want you can create a new request.`);
  };

  const handleReliabilityDropdown = () => {
    const next = reliabilityFilter === 'All Workers' ? 'Top 10% Workers' : reliabilityFilter === 'Top 10% Workers' ? 'Top 20% Workers' : 'All Workers';
    setReliabilityFilter(next);
    Alert.alert('Filter Applied', `Showing ${next}.`);
  };

  const handleTopRatedViewAll = () => {
    Alert.alert('Top Rated', 'Opening full Top Rated list (demo placeholder).');
  };

  const handleTopRatedProfile = (name: string) => {
    Alert.alert('Worker Profile', `Opening profile for ${name} (demo placeholder).`);
  };

  const handleMessage = (reqTitle: string) => {
    Alert.alert('Message', `Opening chat for ${reqTitle}.`);
  };

  const handleBookNow = () => {
    router.push('/(tabs)/services');
  };

  if (user?.role === 'worker') {
    return <Redirect href="/(tabs)/explore" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}>
      {/* Replicating .dashboard-welcome */}
      <View style={styles.dashboardWelcome}>
        <View style={styles.dashboardWelcomeHeader}>
          <View style={styles.welcomeTextColumn}>
            <View style={styles.welcomeTitleRow}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <View style={styles.systemStatusBadge}>
                <View style={styles.statusDotAnimated} />
                <Text style={styles.systemStatusText}>System Online</Text>
              </View>
            </View>
            <Text style={styles.userName}>{user?.name || 'Rhoydel Jr Elan'}</Text>
            <Text style={styles.welcomeSubtitle}>Manage your household services and trusted workers.</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          <View style={styles.statusTabs}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('Pending')}
              style={[styles.tabBtn, activeTab === 'Pending' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'Pending' && styles.tabBtnTextActive]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('Confirmed')}
              style={[styles.tabBtn, activeTab === 'Confirmed' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'Confirmed' && styles.tabBtnTextActive]}>Confirmed</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>RELIABILITY SCORE</Text>
            <TouchableOpacity style={styles.scoreDropdown} onPress={handleReliabilityDropdown} activeOpacity={0.7}>
              <Text style={styles.scoreDropdownText}>{reliabilityFilter} ★  ˅</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftCol}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Requests</Text>
            <View style={styles.badgeCount}><Text style={styles.badgeCountText}>3</Text></View>
          </View>

          {MOCK_REQUESTS.map(req => (
            <Card key={req.id} style={styles.requestCard}>
              <View style={styles.reqTop}>
                <View style={styles.reqIconPlaceholder} />
                <View style={styles.reqInfo}>
                  <View style={styles.reqTitleRow}>
                    <Text style={styles.reqTitle}>{req.title}</Text>
                    <View style={styles.reqStatus}>
                      <Badge type="primary" text={req.status} />
                    </View>
                  </View>
                  <Text style={styles.reqCategory} numberOfLines={1}>{req.category}</Text>
                  <View style={styles.reqDetailsRow}>
                    <Text style={styles.reqDetailText}>📅 {req.time}</Text>
                    <Text style={styles.reqDetailText}>  •  Est. {req.est}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.reqDivider} />

              <View style={styles.reqBottom}>
                {req.isSearching ? (
                  <Text style={styles.searchMsg}>Searching for top-rated electricians...</Text>
                ) : (
                  <View style={styles.workerRow}>
                    <View style={styles.workerAvatarSmall}><Text style={styles.workerAvatarTextSmall}>{req.worker![0]}</Text></View>
                    <View style={styles.workerInfoText}>
                      <Text style={styles.workerNameSmall} numberOfLines={1}>{req.worker}</Text>
                      <Text style={styles.workerRatingSmall}>★ {req.rating}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.reqActions}>
                  {req.isSearching ? (
                    <Text style={styles.cancelText} onPress={() => handleCancelRequest(req.title)}>Cancel</Text>
                  ) : (
                    <>
                      <Button title="Details" type="outline" size="sm" onPress={() => handleShowDetails(req.title)} style={styles.actionBtnSmall} textStyle={styles.actionBtnTextSmall} />
                      <Button title="Message" type="primary" size="sm" onPress={() => handleMessage(req.title)} style={[styles.actionBtnSmall, styles.actionBtnPrimary]} textStyle={styles.actionBtnTextPrimary} />
                    </>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.rightCol}>
          <Card style={styles.bookBannerCard}>
            <Text style={styles.bannerTitle}>Need a new service?</Text>
            <Text style={styles.bannerSub}>Find reliable workers for your next project instantly.</Text>
            <Button title="Book Now" type="outline" onPress={handleBookNow} style={styles.bannerBtn} textStyle={styles.bannerBtnText} />
          </Card>

          <Card style={styles.topRatedCard}>
            <View style={styles.trHeader}>
              <Text style={styles.trTitle}>Top Rated Nearby</Text>
              <Text style={styles.trLink} onPress={handleTopRatedViewAll}>View All</Text>
            </View>
            {MOCK_TOP_RATED.map(tr => (
              <TouchableOpacity key={tr.id} style={styles.trItem} onPress={() => handleTopRatedProfile(tr.name)} activeOpacity={0.75}>
                <View style={styles.trAvatar}><Text style={styles.trAvatarText}>{tr.name[0]}</Text></View>
                <View style={styles.trInfo}>
                  <Text style={styles.trName}>{tr.name}</Text>
                  <Text style={styles.trRole}>{tr.role}</Text>
                </View>
                <View style={styles.trScore}>
                  <Text style={styles.trRating}>{tr.rating}★</Text>
                  <Text style={styles.trRel}>{tr.rel} {tr.id === '3' ? '' : 'Reliability'}</Text>
                </View>
              </TouchableOpacity>
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
  dashboardWelcome: {
    marginBottom: 28,
  },
  dashboardWelcomeHeader: {
    marginBottom: 24,
  },
  welcomeTextColumn: {
    flex: 1,
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcomeText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  userName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  systemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 140, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 140, 255, 0.2)',
  },
  statusDotAnimated: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.accent,
    marginRight: 6,
  },
  systemStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.accent,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 10,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBgSolid,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Theme.colors.accent,
  },
  tabBtnText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFF',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  scoreDropdown: {
    backgroundColor: Theme.colors.cardBg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scoreDropdownText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  mainContent: {
    flexDirection: 'column', // In mobile everything stacks vertically
  },
  leftCol: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 10,
  },
  badgeCount: {
    backgroundColor: '#2D3748',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  requestCard: {
    padding: 0,
    marginBottom: 20,
    overflow: 'hidden',
    borderRadius: 16,
  },
  reqTop: {
    flexDirection: 'row',
    padding: 20,
  },
  reqIconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 16,
  },
  reqInfo: {
    flex: 1,
    paddingRight: 8,
  },
  reqTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  reqTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  reqCategory: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  reqDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  reqDetailText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  reqStatus: {
    flexShrink: 0,
  },
  reqDivider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
  },
  reqBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  searchMsg: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  workerInfoText: {
    flex: 1,
  },
  workerAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  workerAvatarTextSmall: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  workerNameSmall: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  workerRatingSmall: {
    color: Theme.colors.accent,
    fontSize: 11,
    marginTop: 2
  },
  reqActions: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 8,
  },
  actionBtnSmall: {
    minWidth: 90,
    borderRadius: 8,
  },
  actionBtnTextSmall: {
    color: '#FFF',
  },
  actionBtnPrimary: {
  },
  actionBtnTextPrimary: {
    color: '#FFF',
  },
  cancelText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
  rightCol: {
    marginBottom: 40,
  },
  bookBannerCard: {
    backgroundColor: '#5A4EE3',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 0,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 20,
  },
  bannerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  bannerBtnText: {
    color: '#FFF',
  },
  topRatedCard: {
    padding: 20,
  },
  trHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  trLink: {
    color: Theme.colors.accent,
    fontSize: 12,
  },
  trItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trAvatarText: {
    color: '#FFF',
    fontWeight: '700',
  },
  trInfo: {
    flex: 1,
  },
  trName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trRole: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  trScore: {
    alignItems: 'flex-end',
  },
  trRating: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  trRel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
  }
});

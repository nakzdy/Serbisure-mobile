import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/CommonUI';
import { GradientText } from '../../components/GradientText';
import AppModal from '../../components/Modal';
import { Badge } from '../../components/StatusUI';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBookings } from '../../contexts/BookingsContext';
import { useRequests } from '../../contexts/RequestsContext';
import { useApplications } from '../../contexts/ApplicationsContext';
import { WORKERS } from '../../data/workers';

const TOP_RATED = WORKERS.slice(0, 3).map(worker => ({
  id: worker.id,
  name: worker.name,
  role: `${worker.skills[0]} Specialist`,
  rating: Math.min(5, Math.round((worker.reliability / 20) * 10) / 10),
  rel: `${worker.reliability}%`,
}));

// Helper to get category icon
const getCategoryIcon = (category: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (category?.toLowerCase()) {
    case 'plumbing':
      return { name: 'build', color: '#8b8ba3' };
    case 'electrical':
      return { name: 'flash', color: '#f39c12' };
    case 'cleaning':
      return { name: 'brush', color: '#e74c3c' };
    default:
      return { name: 'construct', color: '#8b8ba3' };
  }
};

// Helper to get status badge type and label
const getStatusBadge = (status: string, requestStatus: string): { label: string; type: 'warning' | 'primary' | 'awaiting' | 'success' } => {
  if (requestStatus === 'Open') {
    return { label: 'Pending Worker', type: 'primary' };
  }
  if (requestStatus === 'Confirmed') {
    return { label: 'Awaiting Confirm', type: 'awaiting' };
  }
  if (requestStatus === 'Completed') {
    return { label: 'Completed', type: 'success' };
  }
  if (status === 'Pending Approval') {
    return { label: 'Pending Approval', type: 'warning' };
  }
  return { label: status, type: 'primary' };
};

// Helper for greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
};

export default function HomeownerDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { bookings, updateBookingStatus, addBooking } = useBookings();
  const { requests, updateRequest } = useRequests();
  const { applications, updateApplication } = useApplications();
  const [activeTab, setActiveTab] = useState<'Pending' | 'Confirmed'>('Pending');
  const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; message: string; actions?: { label: string; onPress?: () => void; type?: 'primary' | 'secondary' }[] }>({
    visible: false,
    title: '',
    message: '',
  });
  const [detailsRequest, setDetailsRequest] = useState<any | null>(null);
  const [messageRequest, setMessageRequest] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  const [appModalRequestId, setAppModalRequestId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const openInfoModal = (title: string, message: string, actions?: { label: string; onPress?: () => void; type?: 'primary' | 'secondary' }[]) => {
    setInfoModal({ visible: true, title, message, actions });
  };

  const closeInfoModal = () => setInfoModal(prev => ({ ...prev, visible: false }));

  const handleCancelRequest = (req: any) => {
    openInfoModal('Cancel Request', `Cancel "${req.title}"? This will remove the request from your active list.`, [
      { label: 'Keep Request', type: 'secondary' },
      {
        label: 'Cancel Request',
        type: 'primary',
        onPress: () => {
          updateRequest(req.id, { status: 'Cancelled' });
          applications
            .filter(a => a.requestId === req.id)
            .forEach(app => updateApplication(app.id, { status: 'Declined' }));
        },
      },
    ]);
  };

  const homeownerRequests = useMemo(() => {
    const name = user?.name || '';
    const list = name ? requests.filter(r => r.homeownerName === name) : requests;
    return list.map(req => ({
      id: req.id,
      title: req.title,
      category: req.category,
      subcategory: (req as any).subcategory || '',
      urgency: (req as any).urgency || 'Standard',
      time: req.date,
      est: req.est,
      status: req.status === 'Open' ? 'Pending Worker' : req.status,
      worker: bookings.find(b => b.requestId === req.id)?.workerName,
      workerRating: bookings.find(b => b.requestId === req.id)?.reliability,
      requestStatus: req.status,
    }));
  }, [requests, bookings, user?.name]);

  const filteredRequests = useMemo(() => {
    if (homeownerRequests.length === 0) return [];
    return homeownerRequests.filter(req =>
      activeTab === 'Pending'
        ? req.requestStatus === 'Open'
        : req.requestStatus === 'Confirmed' || req.requestStatus === 'Completed'
    );
  }, [homeownerRequests, activeTab]);

  const requestApplications = useMemo(() => {
    const map: Record<string, typeof applications> = {};
    applications.forEach(app => {
      if (!map[app.requestId]) map[app.requestId] = [];
      map[app.requestId].push(app);
    });
    return map;
  }, [applications]);

  const handleAcceptApplication = (requestId: string, appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    updateApplication(appId, { status: 'Accepted' });
    applications
      .filter(a => a.requestId === requestId && a.id !== appId)
      .forEach(other => updateApplication(other.id, { status: 'Declined' }));
    updateRequest(requestId, { status: 'Confirmed' });
    addBooking({
      id: `book-${Date.now()}`,
      workerId: app.workerName,
      workerName: app.workerName,
      homeownerName: app.homeownerName,
      skills: [app.serviceType],
      reliability: 90,
      requestId,
      serviceType: app.serviceType,
      serviceDate: app.date,
      estimatedCost: 'TBD',
      createdAt: new Date().toLocaleString(),
      status: 'Confirmed',
    });
    setAppModalRequestId(null);
  };

  const handleDeclineApplication = (appId: string) => {
    updateApplication(appId, { status: 'Declined' });
  };

  const handleBookNow = () => {
    router.push('/(tabs)/services');
  };

  if (user?.role === 'worker') {
    return <Redirect href="/(tabs)/explore" />;
  }

  const activeApplications = appModalRequestId ? (requestApplications[appModalRequestId] || []) : [];

  // Stats computation
  const activeCount = homeownerRequests.filter(r => r.requestStatus === 'Open' || r.requestStatus === 'Confirmed').length;
  const ratings = bookings.filter(b => b.reliability).map(b => b.reliability);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length / 20).toFixed(1) : '4.9';
  const estTotal = user?.role === 'worker' ? 0 : homeownerRequests.reduce((acc, r) => {
    const val = parseFloat(r.est.replace('₱', ''));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
      <AppModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        actions={infoModal.actions}
        onClose={closeInfoModal}
      />

      <AppModal
        visible={!!detailsRequest}
        title="Request Details"
        onClose={() => setDetailsRequest(null)}
        actions={[
          { label: 'Message Worker', type: 'primary', onPress: () => detailsRequest && setMessageRequest(detailsRequest) },
          { label: 'Close', type: 'secondary' },
        ]}
      >
        {detailsRequest && (
          <View style={styles.modalBlock}>
            <Text style={styles.modalTitle}>{detailsRequest.title}</Text>
            <Text style={styles.modalLine}>{detailsRequest.category}{detailsRequest.subcategory ? ` · ${detailsRequest.subcategory}` : ''}</Text>
            <Text style={styles.modalLine}>Requested: {detailsRequest.time}</Text>
            <Text style={styles.modalLine}>Estimate: {detailsRequest.est}</Text>
            <Text style={styles.modalLine}>Status: {detailsRequest.status}</Text>
          </View>
        )}
      </AppModal>

      <AppModal
        visible={!!messageRequest}
        title="Message Worker"
        onClose={() => { setMessageRequest(null); setMessageText(''); }}
        actions={[
          { label: 'Send', type: 'primary', onPress: () => openInfoModal('Message Sent', `Your message has been sent to ${messageRequest?.worker || 'the worker'}.`) },
          { label: 'Cancel', type: 'secondary' },
        ]}
      >
        {messageRequest && (
          <View style={styles.modalBlock}>
            <Text style={styles.modalLine}>To: {messageRequest.worker || 'Worker'}</Text>
            <Text style={styles.modalLine}>Regarding: {messageRequest.title}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
          </View>
        )}
      </AppModal>

      <AppModal
        visible={!!appModalRequestId}
        title="Applications"
        onClose={() => setAppModalRequestId(null)}
      >
        {activeApplications.length === 0 && (
          <Text style={styles.modalLine}>No applications yet.</Text>
        )}
        {activeApplications.map(app => (
          <View key={app.id} style={styles.appRow}>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{app.workerName}</Text>
              <Text style={styles.appMeta}>Service: {app.serviceType}</Text>
              <Text style={styles.appMeta}>Requested: {app.date}</Text>
            </View>
            <View style={styles.appActions}>
              <Button title="Accept" size="sm" onPress={() => handleAcceptApplication(app.requestId, app.id)} />
              <Button title="Decline" size="sm" type="secondary" onPress={() => handleDeclineApplication(app.id)} />
            </View>
          </View>
        ))}
      </AppModal>

      {/* ===== HEADER BAR ===== */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <GradientText style={styles.headerTitle}>SerbiSure</GradientText>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.7}
          onPress={() => openInfoModal('Notifications', 'No new notifications at this time.')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* ===== GREETING SECTION ===== */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingLabel}>{getGreeting()}</Text>
        <Text style={styles.greetingName}>Welcome, {user?.name?.split(' ')[0] || 'Homeowner'}</Text>
        <Text style={styles.greetingSubtitle}>Manage your household services.</Text>
        <View style={styles.systemBadge}>
          <View style={styles.systemDot} />
          <Text style={styles.systemBadgeText}>System Online</Text>
        </View>
      </View>

      {/* ===== STATS ROW ===== */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{avgRating}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₱{estTotal}</Text>
          <Text style={styles.statLabel}>Est. Total</Text>
        </View>
      </View>

      {/* ===== BOOK NOW BANNER ===== */}
      <TouchableOpacity activeOpacity={0.85} onPress={handleBookNow}>
        <LinearGradient
          colors={[colors.accent, colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bookBanner}
        >
          <View style={styles.bookBannerContent}>
            <View style={styles.bookBannerTextCol}>
              <Text style={styles.bookBannerTitle}>Need a new service?</Text>
              <Text style={styles.bookBannerSub}>Find trusted workers instantly</Text>
            </View>
            <View style={styles.bookNowBtn}>
              <Text style={styles.bookNowBtnText}>Book Now</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ===== ACTIVE REQUESTS SECTION ===== */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Active Requests</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredRequests.length}</Text>
          </View>
        </View>
        <View style={styles.tabPills}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('Pending')}
            style={[styles.tabPill, activeTab === 'Pending' && styles.tabPillActive]}
          >
            <Text style={[styles.tabPillText, activeTab === 'Pending' && styles.tabPillTextActive]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('Confirmed')}
            style={[styles.tabPill, activeTab === 'Confirmed' && styles.tabPillActive]}
          >
            <Text style={[styles.tabPillText, activeTab === 'Confirmed' && styles.tabPillTextActive]}>Confirmed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== REQUEST CARDS ===== */}
      {filteredRequests.map(req => {
        const icon = getCategoryIcon(req.category);
        const statusBadge = getStatusBadge(req.status, req.requestStatus);
        const hasApps = (requestApplications[req.id]?.length || 0) > 0;
        const workerInitials = req.worker ? req.worker.split(' ').map(n => n[0]).join('').substring(0, 2) : '';

        return (
          <View key={req.id} style={styles.requestCard}>
            {/* Top section */}
            <View style={styles.reqTopSection}>
              <View style={styles.reqIconWrap}>
                <Ionicons name={icon.name} size={24} color={icon.color} />
              </View>
              <View style={styles.reqMainInfo}>
                <View style={styles.reqTitleRow}>
                  <Text style={styles.reqTitle} numberOfLines={1}>{req.title}</Text>
                  <Badge text={statusBadge.label} type={statusBadge.type} />
                </View>
                <Text style={styles.reqCategory}>{req.category} · {req.subcategory || req.urgency}</Text>
                <View style={styles.reqMetaRow}>
                  <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.reqMetaText}>{req.time}</Text>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} style={{ marginLeft: 10 }} />
                  <Text style={styles.reqMetaText}>Est. {req.est}</Text>
                </View>
              </View>
            </View>

            {/* Bottom section */}
            <View style={styles.reqBottomSection}>
              {req.requestStatus === 'Open' && !hasApps ? (
                <>
                  <View style={styles.searchingRow}>
                    <View style={styles.searchingDot} />
                    <Text style={styles.searchingText}>
                      Searching for {req.category.toLowerCase() === 'plumbing' ? 'plumbers' :
                        req.category.toLowerCase() === 'electrical' ? 'electricians' :
                        req.category.toLowerCase() === 'cleaning' ? 'cleaners' : 'workers'}…
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                    onPress={() => handleCancelRequest(req)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {req.worker && (
                    <View style={styles.workerRow}>
                      <View style={styles.workerAvatar}>
                        <Text style={styles.workerAvatarText}>{workerInitials}</Text>
                      </View>
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName} numberOfLines={1}>{req.worker}</Text>
                        <Text style={styles.workerRating}>★ {req.workerRating ? (req.workerRating / 20).toFixed(1) : '4.8'}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.actionBtnsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      activeOpacity={0.7}
                      onPress={() => setDetailsRequest(req)}
                    >
                      <Text style={styles.actionBtnOutlineText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnFilled}
                      activeOpacity={0.7}
                      onPress={() => setMessageRequest(req)}
                    >
                      <Text style={styles.actionBtnFilledText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                  {req.requestStatus === 'Open' && hasApps && (
                    <TouchableOpacity
                      style={[styles.actionBtnOutline, { marginTop: 8, alignSelf: 'stretch' }]}
                      activeOpacity={0.7}
                      onPress={() => setAppModalRequestId(req.id)}
                    >
                      <Text style={styles.actionBtnOutlineText}>View Applications ({requestApplications[req.id]?.length})</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        );
      })}

      {filteredRequests.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No requests yet. Book a service or post a request to see it here.</Text>
        </View>
      )}

      {/* ===== TOP RATED NEARBY ===== */}
      <View style={styles.trSection}>
        <View style={styles.trHeader}>
          <Text style={styles.trSectionTitle}>Top Rated Nearby</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openInfoModal('Top Rated Nearby', 'Browse the highest-rated workers available near you.', [
              { label: 'View Services', type: 'primary', onPress: () => router.push('/(tabs)/services') },
              { label: 'Close', type: 'secondary' },
            ])}
          >
            <Text style={styles.trViewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {TOP_RATED.map(tr => (
          <TouchableOpacity
            key={tr.id}
            style={styles.trItem}
            onPress={() => router.push({ pathname: '/(tabs)/worker/[id]', params: { id: tr.id } })}
            activeOpacity={0.75}
          >
            <View style={styles.trAvatar}>
              <Text style={styles.trAvatarText}>
                {tr.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Text>
            </View>
            <View style={styles.trInfo}>
              <Text style={styles.trName}>{tr.name}</Text>
              <Text style={styles.trRole}>{tr.role}</Text>
            </View>
            <View style={styles.trScoreCol}>
              <View style={styles.trRatingRow}>
                <Text style={styles.trRatingNum}>{tr.rating.toFixed(1)}</Text>
                <Text style={styles.trStar}> ★</Text>
              </View>
              <Text style={styles.trRel}>{tr.rel} Reliability</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof import('../../constants/theme').DarkColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg1,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBgSolid,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // Greeting
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingLabel: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  greetingName: {
    color: colors.text,
    fontSize: 28,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 12,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: `${colors.success}1A`,
    borderWidth: 1,
    borderColor: `${colors.success}33`,
  },
  systemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  systemBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '700',
    color: colors.success,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBgSolid,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statNumber: {
    color: colors.text,
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },

  // Book Now Banner
  bookBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bookBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookBannerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  bookBannerTitle: {
    color: colors.textOnAccent,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    marginBottom: 4,
  },
  bookBannerSub: {
    color: `${colors.textOnAccent}CC`,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  bookNowBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookNowBtnText: {
    color: colors.textOnAccent,
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '700',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.cardBgSolid,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  countBadgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '600',
  },
  tabPills: {
    flexDirection: 'row',
    gap: 0,
    backgroundColor: colors.cardBgSolid,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: colors.accent,
  },
  tabPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '600',
  },
  tabPillTextActive: {
    color: colors.textOnAccent,
  },

  // Request Cards
  requestCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.cardBgSolid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  reqTopSection: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  reqIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bg1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reqMainInfo: {
    flex: 1,
  },
  reqTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  reqTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    flex: 1,
  },
  reqCategory: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 6,
  },
  reqMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqMetaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  reqBottomSection: {
    padding: 16,
    paddingTop: 0,
  },

  // Searching state
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accent,
    marginRight: 8,
  },
  searchingText: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  cancelBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.cardBgSolid,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelBtnText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },

  // Worker row
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  workerAvatarText: {
    color: colors.textOnAccent,
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '700',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '600',
  },
  workerRating: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    marginTop: 1,
  },

  // Action buttons
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBgSolid,
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  actionBtnFilled: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.text,
    alignItems: 'center',
  },
  actionBtnFilledText: {
    color: colors.bg1,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },

  // Empty state
  emptyCard: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: colors.cardBgSolid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },

  // Top Rated Nearby
  trSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  trHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trSectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
  },
  trViewAll: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  trItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBgSolid,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  trAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  trAvatarText: {
    color: colors.text,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '700',
    fontSize: 14,
  },
  trInfo: {
    flex: 1,
  },
  trName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  trRole: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  trScoreCol: {
    alignItems: 'flex-end',
  },
  trRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trRatingNum: {
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 16,
  },
  trStar: {
    color: '#f1c40f',
    fontSize: 14,
  },
  trRel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },

  // Modals
  modalBlock: {
    gap: 8,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
  },
  modalLine: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.inputBg,
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: 'DMSans_400Regular',
  },
  appRow: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.cardBg,
  },
  appInfo: {
    marginBottom: 10,
  },
  appName: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '700',
    marginBottom: 4,
  },
  appMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 2,
  },
  appActions: {
    gap: 8,
  },
});

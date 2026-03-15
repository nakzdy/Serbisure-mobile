import { Redirect, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/CommonUI';
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

export default function HomeownerDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { bookings, updateBookingStatus, addBooking } = useBookings();
  const { requests, updateRequest } = useRequests();
  const { applications, updateApplication } = useApplications();
  const [activeTab, setActiveTab] = useState<'Pending' | 'Confirmed'>('Pending');
  const [reliabilityFilter, setReliabilityFilter] = useState<'All Workers' | 'Top 10% Workers' | 'Top 20% Workers'>('All Workers');
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

  const handleReliabilityDropdown = () => {
    const next = reliabilityFilter === 'All Workers' ? 'Top 10% Workers' : reliabilityFilter === 'Top 10% Workers' ? 'Top 20% Workers' : 'All Workers';
    setReliabilityFilter(next);
    openInfoModal('Filter Applied', `Showing ${next}.`);
  };

  const homeownerRequests = useMemo(() => {
    const name = user?.name || '';
    const list = name ? requests.filter(r => r.homeownerName === name) : requests;
    return list.map(req => ({
      id: req.id,
      title: req.title,
      category: req.category,
      time: req.date,
      est: req.est,
      status: req.status === 'Open' ? 'Pending Worker' : req.status,
      worker: bookings.find(b => b.requestId === req.id)?.workerName,
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

  const filteredTopRated = useMemo(() => {
    const threshold = reliabilityFilter === 'All Workers' ? 0 : reliabilityFilter === 'Top 10% Workers' ? 4.9 : 4.5;
    return TOP_RATED.filter(worker => worker.rating >= threshold);
  }, [reliabilityFilter]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}>
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
            <Text style={styles.modalLine}>{detailsRequest.category}</Text>
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
            <Text style={styles.userName}>{user?.name || 'Homeowner'}</Text>
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
              <Text style={styles.scoreDropdownText}>{reliabilityFilter} *</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftCol}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Requests</Text>
            <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{filteredRequests.length}</Text></View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Track open requests and confirmed bookings in one place.
          </Text>

          {filteredRequests.map(req => (
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
                    <Text style={styles.reqDetailText}>Requested: {req.time}</Text>
                    <Text style={styles.reqDetailText}> - Est. {req.est}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.reqDivider} />

              <View style={styles.reqBottom}>
                {req.requestStatus === 'Open' ? (
                  <Text style={styles.searchMsg}>Awaiting worker applications...</Text>
                ) : (
                  <View style={styles.workerRow}>
                    <View style={styles.workerAvatarSmall}><Text style={styles.workerAvatarTextSmall}>{(req.worker || 'W')[0]}</Text></View>
                    <View style={styles.workerInfoText}>
                      <Text style={styles.workerNameSmall} numberOfLines={1}>{req.worker || 'Assigned Worker'}</Text>
                      <Text style={styles.workerRatingSmall}>Assigned worker</Text>
                    </View>
                  </View>
                )}
                <View style={styles.reqActions}>
                  <Button title="Details" type="outline" size="sm" onPress={() => setDetailsRequest(req)} style={styles.actionBtnSmall} textStyle={styles.actionBtnTextSmall} />
                  <Button title="Message" type="primary" size="sm" onPress={() => setMessageRequest(req)} style={[styles.actionBtnSmall, styles.actionBtnPrimary]} textStyle={styles.actionBtnTextPrimary} />
                  {req.requestStatus === 'Open' && (requestApplications[req.id]?.length || 0) > 0 && (
                    <Button title="Applications" type="secondary" size="sm" onPress={() => setAppModalRequestId(req.id)} style={styles.actionBtnSmall} />
                  )}
                  {req.requestStatus !== 'Cancelled' && (
                    <Text style={styles.cancelText} onPress={() => handleCancelRequest(req)}>Cancel</Text>
                  )}
                </View>
              </View>
            </Card>
          ))}

          {filteredRequests.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No requests yet. Book a service or post a request to see it here.</Text>
            </Card>
          )}
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
              <Text
                style={styles.trLink}
                onPress={() => openInfoModal('Top Rated Nearby', 'Browse the highest-rated workers available near you.', [
                  { label: 'View Services', type: 'primary', onPress: () => router.push('/(tabs)/services') },
                  { label: 'Close', type: 'secondary' },
                ])}
              >
                View All
              </Text>
            </View>
            {filteredTopRated.map(tr => (
              <TouchableOpacity key={tr.id} style={styles.trItem} onPress={() => router.push({ pathname: '/(tabs)/worker/[id]', params: { id: tr.id } })} activeOpacity={0.75}>
                <View style={styles.trAvatar}><Text style={styles.trAvatarText}>{tr.name[0]}</Text></View>
                <View style={styles.trInfo}>
                  <Text style={styles.trName}>{tr.name}</Text>
                  <Text style={styles.trRole}>{tr.role}</Text>
                </View>
                <View style={styles.trScore}>
                  <Text style={styles.trRating}>{tr.rating.toFixed(1)}*</Text>
                  <Text style={styles.trRel}>{tr.rel}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {filteredTopRated.length === 0 && (
              <Text style={styles.emptyText}>No workers match this reliability filter.</Text>
            )}
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
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  userName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  systemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.statusPending,
    borderWidth: 1,
    borderColor: colors.statusPendingBorder,
  },
  statusDotAnimated: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  systemStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 14,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: colors.cardBgSolid,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.accent,
  },
  tabBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: colors.textOnAccent,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  scoreDropdown: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scoreDropdownText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  mainContent: {
    flexDirection: 'column',
  },
  leftCol: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 10,
  },
  badgeCount: {
    backgroundColor: colors.cardBgSolid,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: colors.textMuted,
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
    backgroundColor: colors.cardBg,
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
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  reqCategory: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  reqDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  reqDetailText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  reqStatus: {
    flexShrink: 0,
  },
  reqDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  reqBottom: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 12,
    padding: 20,
    backgroundColor: colors.cardBg,
  },
  searchMsg: {
    color: colors.textMuted,
    fontSize: 13,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  workerInfoText: {
    flex: 1,
  },
  workerAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBgSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  workerAvatarTextSmall: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  workerNameSmall: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  workerRatingSmall: {
    color: colors.accent,
    fontSize: 11,
    marginTop: 2
  },
  reqActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtnSmall: {
    minWidth: 110,
    flexGrow: 1,
    borderRadius: 8,
  },
  actionBtnTextSmall: {
    color: colors.text,
  },
  actionBtnPrimary: {
  },
  actionBtnTextPrimary: {
    color: colors.textOnAccent,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: 6,
  },
  rightCol: {
    marginBottom: 40,
  },
  bookBannerCard: {
    backgroundColor: colors.accent,
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 0,
  },
  bannerTitle: {
    color: colors.textOnAccent,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  bannerSub: {
    color: colors.textOnAccentMuted,
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
    color: colors.textOnAccent,
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
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  trLink: {
    color: colors.accent,
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
    backgroundColor: colors.cardBgSolid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trAvatarText: {
    color: colors.text,
    fontWeight: '700',
  },
  trInfo: {
    flex: 1,
  },
  trName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trRole: {
    color: colors.textMuted,
    fontSize: 12,
  },
  trScore: {
    alignItems: 'flex-end',
  },
  trRating: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  trRel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyCard: {
    padding: 20,
  },
  modalBlock: {
    gap: 8,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  modalLine: {
    color: colors.textMuted,
    fontSize: 13,
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
    fontWeight: '700',
    marginBottom: 4,
  },
  appMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  appActions: {
    gap: 8,
  },
});

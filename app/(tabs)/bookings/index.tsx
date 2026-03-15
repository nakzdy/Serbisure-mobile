import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/CommonUI';
import { Badge } from '../../../components/StatusUI';
import { useBookings } from '../../../contexts/BookingsContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequests } from '../../../contexts/RequestsContext';
import { useApplications } from '../../../contexts/ApplicationsContext';
import AppModal from '../../../components/Modal';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { bookings, updateBookingStatus } = useBookings();
  const { requests, updateRequest } = useRequests();
  const { applications, addApplication, updateApplication } = useApplications();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const isWorker = user?.role === 'worker';
  const workerName = user?.name || '';
  const hasMatch = workerName ? bookings.some(b => b.workerName === workerName) : false;
  const visibleBookings = isWorker
    ? (hasMatch ? bookings.filter(b => b.workerName === workerName) : bookings)
    : bookings;

  const openRequests = requests.filter(r => r.status === 'Open');
  const appliedRequestIds = applications.filter(a => a.workerName === workerName).map(a => a.requestId);
  const incomingRequests = openRequests.filter(r => !appliedRequestIds.includes(r.id));
  const activeJobs = visibleBookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');

  const openModal = (title: string, message: string) => setModal({ visible: true, title, message });
  const closeModal = () => setModal(prev => ({ ...prev, visible: false }));

  const handleApplyToRequest = (id: string, title: string, category: string, date: string, homeownerName: string) => {
    if (appliedRequestIds.includes(id)) {
      openModal('Already Applied', 'You already applied to this request.');
      return;
    }
    addApplication({
      id: `app-${Date.now()}`,
      requestId: id,
      workerName,
      serviceType: category,
      date,
      homeownerName,
      status: 'Applied',
    });
    openModal('Application Sent', 'Your application was sent to the homeowner.');
  };

  const handleDeclineRequest = () => {
    openModal('Request Skipped', 'You can apply to this request later.');
  };

  const handleBookingStatusUpdate = (bookingId: string, status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled') => {
    updateBookingStatus(bookingId, status);
    const booking = bookings.find(b => b.id === bookingId);
    if (booking?.requestId) {
      if (status === 'Confirmed') {
        updateRequest(booking.requestId, { status: 'Confirmed' });
        const app = applications.find(a => a.requestId === booking.requestId && a.workerName === booking.workerName);
        if (app) updateApplication(app.id, { status: 'Accepted' });
      }
      if (status === 'Completed') {
        updateRequest(booking.requestId, { status: 'Completed' });
        const app = applications.find(a => a.requestId === booking.requestId && a.workerName === booking.workerName);
        if (app) updateApplication(app.id, { status: 'Completed' });
      }
      if (status === 'Cancelled') {
        updateRequest(booking.requestId, { status: 'Cancelled' });
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
      <View style={styles.header}>
        <Text style={styles.title}>{isWorker ? 'Bookings' : 'My Bookings'}</Text>
        <Text style={styles.subtitle}>
          {isWorker ? 'Apply to homeowner requests and manage active jobs' : 'Review your scheduled services and booking status'}
        </Text>
      </View>

      {isWorker && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Incoming Requests</Text>
            <Text style={styles.sectionCount}>{incomingRequests.length}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Open homeowner requests you can apply for.</Text>

          {incomingRequests.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No incoming requests right now. Stay online to get more jobs.</Text>
            </Card>
          )}

          {incomingRequests.map(req => (
            <Card key={req.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.requestTitle}>{req.title}</Text>
                  <Text style={styles.requestMeta}>{req.category}</Text>
                  <Text style={styles.requestMeta}>Requested: {req.date}</Text>
                  <Text style={styles.requestMeta}>Estimate: {req.est}</Text>
                </View>
                <Badge text="Open" type="pending" />
              </View>
              <View style={styles.actionRow}>
                <Button
                  title="Apply"
                  size="sm"
                  onPress={() => handleApplyToRequest(req.id, req.title, req.category, req.date, req.homeownerName)}
                  style={styles.actionBtn}
                />
                <Button
                  title="Decline"
                  type="secondary"
                  size="sm"
                  onPress={handleDeclineRequest}
                  style={styles.actionBtn}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      {isWorker && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Jobs</Text>
            <Text style={styles.sectionCount}>{activeJobs.length}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Confirmed or pending bookings assigned to you.</Text>

          {activeJobs.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active jobs yet. Confirmed bookings will appear here.</Text>
            </Card>
          )}

          {activeJobs.map(booking => (
            <Card key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingTop}>
                <View>
                  <Text style={styles.workerName}>{booking.homeownerName || 'Homeowner'}</Text>
                  <Text style={styles.workerMeta}>{booking.serviceType || ((booking.skills && booking.skills.length > 0) ? booking.skills.join(', ') : 'Service Request')}</Text>
                  <Text style={styles.workerMeta}>Service Date: {booking.serviceDate || booking.createdAt || 'TBD'}</Text>
                </View>
                <Badge
                  text={booking.status}
                  type={booking.status === 'Completed' ? 'success' : booking.status === 'Cancelled' ? 'outline' : 'pending'}
                />
              </View>

              <View style={styles.actionRow}>
                {booking.status === 'Pending' && (
                  <Button
                    title="Accept Job"
                    size="sm"
                    onPress={() => handleBookingStatusUpdate(booking.id, 'Confirmed')}
                    style={styles.actionBtn}
                  />
                )}
                {booking.status === 'Confirmed' && (
                  <Button
                    title="Mark Completed"
                    size="sm"
                    onPress={() => handleBookingStatusUpdate(booking.id, 'Completed')}
                    style={styles.actionBtn}
                  />
                )}
                {booking.status !== 'Cancelled' && (
                  <Button
                    title="Decline"
                    type="secondary"
                    size="sm"
                    onPress={() => handleBookingStatusUpdate(booking.id, 'Cancelled')}
                    style={styles.actionBtn}
                    textStyle={styles.cancelText}
                  />
                )}
              </View>
            </Card>
          ))}
        </View>
      )}

      {!isWorker && visibleBookings.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No bookings yet. Book a service to see it here.
          </Text>
        </Card>
      )}

      {!isWorker && visibleBookings.map(booking => (
        <Card key={booking.id} style={styles.bookingCard}>
          <View style={styles.bookingTop}>
            <View>
              <Text style={styles.workerName}>{booking.workerName}</Text>
              <Text style={styles.workerMeta}>{booking.serviceType || ((booking.skills && booking.skills.length > 0) ? booking.skills.join(', ') : 'Service Request')}</Text>
              <Text style={styles.workerMeta}>Reliability: {booking.reliability ?? 'N/A'}%</Text>
              <Text style={styles.workerMeta}>Service Date: {booking.serviceDate || booking.createdAt || 'TBD'}</Text>
            </View>
            <Badge
              text={booking.status}
              type={booking.status === 'Completed' ? 'success' : booking.status === 'Cancelled' ? 'outline' : 'pending'}
            />
          </View>

          <View style={styles.actionRow}>
            {booking.status === 'Pending' && (
              <Button
                title="Confirm Booking"
                size="sm"
                onPress={() => handleBookingStatusUpdate(booking.id, 'Confirmed')}
                style={styles.actionBtn}
              />
            )}
            {booking.status === 'Confirmed' && (
              <Button
                title="Mark Completed"
                size="sm"
                onPress={() => handleBookingStatusUpdate(booking.id, 'Completed')}
                style={styles.actionBtn}
              />
            )}
            {booking.status !== 'Cancelled' && (
              <Button
                title="Cancel"
                type="secondary"
                size="sm"
                onPress={() => handleBookingStatusUpdate(booking.id, 'Cancelled')}
                style={styles.actionBtn}
                textStyle={styles.cancelText}
              />
            )}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: typeof import('../../../constants/theme').DarkColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  requestCard: {
    padding: 18,
    marginBottom: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  requestTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  requestMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  bookingCard: {
    padding: 20,
    marginBottom: 16,
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  workerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  workerMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 130,
  },
  cancelText: {
    color: colors.danger,
  },
  emptyCard: {
    padding: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});

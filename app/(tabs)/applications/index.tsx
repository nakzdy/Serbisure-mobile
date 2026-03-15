import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/CommonUI';
import { Badge } from '../../../components/StatusUI';
import { useApplications } from '../../../contexts/ApplicationsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ApplicationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { applications } = useApplications();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const workerName = user?.name || '';
  const hasMatch = workerName ? applications.some(app => app.workerName === workerName) : false;
  const visibleApps = workerName && hasMatch ? applications.filter(app => app.workerName === workerName) : applications;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>My Applications</Text>
        <Text style={styles.subtitle}>Track the requests you applied for</Text>
      </View>

      {visibleApps.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No applications yet. Apply to an open request to see it here.</Text>
        </Card>
      )}

      {visibleApps.map(app => (
        <Card key={app.id} style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>{app.serviceType}</Text>
              <Text style={styles.cardMeta}>Homeowner: {app.homeownerName}</Text>
              <Text style={styles.cardMeta}>Requested: {app.date}</Text>
            </View>
            <Badge
              text={app.status}
              type={app.status === 'Accepted' ? 'success' : app.status === 'Declined' ? 'outline' : 'pending'}
            />
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
  card: {
    padding: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  emptyCard: {
    padding: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/CommonUI';
import { Badge } from '../../../components/StatusUI';
import { WORKERS } from '../../../data/workers';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

export default function WorkerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  if (user?.role === 'worker') {
    return <Redirect href="/(tabs)/explore" />;
  }

  const worker = WORKERS.find(w => w.id === id);

  if (!worker) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
        <Card style={styles.card}>
          <Text style={styles.title}>Worker not found</Text>
          <Text style={styles.subtitle}>The profile you are looking for is unavailable.</Text>
          <Button title="Back to Services" type="outline" onPress={() => router.push('/(tabs)/services')} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{worker.name[0]}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.roleText}>{worker.skills[0]} Specialist</Text>
          <Badge text={worker.verified ? 'Verified' : 'Pending'} type={worker.verified ? 'success' : 'pending'} />
        </View>
      </View>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bodyText}>{worker.bio}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>Experience: {worker.years} years</Text>
          <Text style={styles.metaItem}>Location: {worker.location}</Text>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillRow}>
          {worker.skills.map(skill => (
            <View key={skill} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Reliability</Text>
        <Text style={styles.bodyText}>Score: {worker.reliability}%</Text>
        <Text style={styles.bodyText}>{worker.tesda ? 'TESDA Certified' : 'No TESDA Certificate'}</Text>
      </Card>

      <View style={styles.actionRow}>
        <Button title="Book Service" onPress={() => router.push({ pathname: '/(tabs)/services', params: { book: worker.id } })} />
        <Button title="View Reviews" type="outline" onPress={() => router.push('/(tabs)/reviews')} />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cardBgSolid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  roleText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    color: colors.textMuted,
    fontSize: 12,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.statusPending,
    borderWidth: 1,
    borderColor: colors.statusPendingBorder,
  },
  skillText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actionRow: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
});

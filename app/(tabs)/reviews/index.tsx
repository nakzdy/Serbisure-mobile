import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/CommonUI';
import { REVIEWS } from '../../../data/reviews';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ReviewsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Review History</Text>
        <Text style={styles.subtitle}>All recent reviews from your completed jobs</Text>
      </View>

      <Card style={styles.card}>
        {REVIEWS.map((review, i) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewName}>{review.name}</Text>
              <Text style={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
            </View>
            <Text style={styles.reviewBody}>{review.body}</Text>
            <Text style={styles.reviewMeta}>{review.time}</Text>
            {i < REVIEWS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </Card>
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
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewStars: {
    color: '#F6AD55',
    fontSize: 13,
    letterSpacing: 2,
  },
  reviewBody: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  reviewMeta: {
    color: colors.muted,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginTop: 16,
  },
});

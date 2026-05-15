import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Card } from "../../components/CommonUI";
import { GradientText } from "../../components/GradientText";
import AppModal from "../../components/Modal";
import { useApplications } from "../../contexts/ApplicationsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useBookings } from "../../contexts/BookingsContext";
import { useRequests } from "../../contexts/RequestsContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useTheme } from "../../contexts/ThemeContext";
import { REVIEWS } from "../../data/reviews";
import { servicesAPI, authAPI, bookingsAPI } from "../../services/api";

// Mock Data
const MOCK_STATS = [
  { id: "1", label: "Profile Views", value: "124" },
  { id: "2", label: "Rating", value: "4.9", suffix: "" },
  { id: "3", label: "Jobs Done", value: "34" },
  { id: "4", label: "Response", value: "98%" },
];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { bookings } = useBookings();
  const { requests } = useRequests();
  const { applications } = useApplications();
  const { settings } = useSettings();
  const [isOnline, setIsOnline] = useState(true);
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: "", message: "" });
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postInfoModal, setPostInfoModal] = useState({
    visible: false,
    title: "",
    message: "",
  });
  const [newService, setNewService] = useState({
    name: "",
    category: "Cleaning",
    price: "",
    description: "",
  });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const CATEGORIES = [
    'Cleaning',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Babysitting',
    'Pet Care',
    'General Help',
  ];
  const [myServices, setMyServices] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0.0);
  const [recentReviewsReal, setRecentReviewsReal] = useState<any[]>([]);

  // Fetch real rating from profile or bookings
  useEffect(() => {
    const fetchRating = async () => {
      try {
        // First try: get rating from worker profile endpoint
        const profile = await authAPI.getProfile();
        const profileData = profile?.data || profile;
        const workerRating = profileData?.worker_profile?.rating;

        if (workerRating != null && parseFloat(workerRating) > 0) {
          setAvgRating(parseFloat(parseFloat(workerRating).toFixed(1)));
        } else {
          // Fallback: compute from bookings that have a rating
          const data = await bookingsAPI.getBookings();
          const safeBookings = Array.isArray(data) ? data : (data?.results || []);
          const rated = safeBookings.filter((b: any) => b.rating != null && b.rating !== 0);
          if (rated.length > 0) {
            const avg = rated.reduce((sum: number, b: any) => sum + Number(b.rating), 0) / rated.length;
            setAvgRating(parseFloat(avg.toFixed(1)));
            const reviews = rated.map((b: any) => ({
              id: b.id,
              author: b.homeowner_details?.full_name || 'Client',
              rating: Number(b.rating),
              text: b.comment || 'No comment left.',
              date: new Date(b.scheduled_date || b.created_at).toLocaleDateString(),
            }));
            setRecentReviewsReal(reviews);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch rating data', err);
      }
    };
    fetchRating();
  }, []);

  const fetchMyServices = async () => {
    try {
      const data = await servicesAPI.getServices();
      if (Array.isArray(data)) {
        const mine = data.filter((s: any) => {
          const pid = s.provider?.id || s.provider;
          return pid === user?.id || pid === user?.uid || pid === parseInt(user?.uid || "0", 10);
        });
        setMyServices(mine);
      } else {
        setMyServices([]);
      }
    } catch (err) {
      console.warn("Failed to load services for worker", err);
      setMyServices([]);
    }
  };

  useEffect(() => {
    if (user?.role === 'worker' || user?.role === 'service_worker') {
      fetchMyServices();
    }
  }, [user, isPostModalOpen]);
  const insets = useSafeAreaInsets();

  const openModal = (title: string, message: string) =>
    setModal({ visible: true, title, message });
  const closeModal = () => setModal((prev) => ({ ...prev, visible: false }));

  const workerName = user?.name || "Worker";
  const openRequests = requests.filter((r) => r.status === "Open");
  const appliedRequestIds = applications
    .filter((a) => a.workerName === workerName)
    .map((a) => a.requestId);
  const incomingCount = openRequests.filter(
    (r) => !appliedRequestIds.includes(r.id),
  ).length;
  const hasMatch = workerName
    ? bookings.some((b) => b.workerName === workerName)
    : false;
  const assignedBookings = hasMatch
    ? bookings.filter((b) => b.workerName === workerName)
    : bookings;
  const activeJobsCount = assignedBookings.filter(
    (b) => b.status === "Confirmed",
  ).length;
  const completedCount = assignedBookings.filter(
    (b) => b.status === "Completed",
  ).length;

  const stats = settings.mockDataEnabled
    ? MOCK_STATS
    : [
        { id: "1", label: "Profile Views", value: "0" },
        { id: "2", label: "Rating", value: avgRating.toFixed(1) },
        { id: "3", label: "Jobs Done", value: completedCount.toString() },
        {
          id: "4",
          label: "Response",
          value:
            activeJobsCount === 0
              ? "0%"
              : `${Math.round((activeJobsCount / (activeJobsCount + completedCount || 1)) * 100)}%`,
        },
      ];

  const recentReviews = settings.mockDataEnabled ? REVIEWS.slice(0, 2) : recentReviewsReal;

  if (user?.role === "homeowner") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
    >
      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

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

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.statusPill,
              isOnline ? styles.statusOnline : styles.statusOffline,
            ]}
            activeOpacity={0.7}
            onPress={() => setIsOnline(!isOnline)}
          >
            <View
              style={[
                styles.statusDot,
                isOnline ? styles.dotOnline : styles.dotOffline,
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isOnline ? styles.textOnline : styles.textOffline,
              ]}
            >
              {isOnline ? "Available" : "Offline"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.7}
            onPress={() =>
              openModal("Notifications", "No new notifications at this time.")
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== GREETING SECTION ===== */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingLabel}>WORKER PORTAL</Text>
        <Text style={styles.greetingName}>
          Hello, {user?.name || "Juan"}!
        </Text>
        <Text style={styles.greetingSubtitle}>
          Here's what's happening today.
        </Text>
      </View>

      {/* ===== STATS GRID ===== */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.statCardGrid}>
            <View style={styles.statValRow}>
              <Text style={styles.statVal}>{stat.value}</Text>
              {stat.suffix ? (
                <Text style={styles.statSuffix}>{stat.suffix}</Text>
              ) : null}
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ===== MY SERVICES (Quick Post) ===== */}
      <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
        <Card style={styles.myServicesCard}>
          {/* Title row: label + count badge */}
          <View style={styles.myServicesHeader}>
            <Text style={styles.myServicesTitle}>My Services</Text>
            <Text style={styles.myServicesCount}>{myServices.length}</Text>
          </View>
          {/* Full-width post button below title */}
          <TouchableOpacity style={styles.postServiceBtn} activeOpacity={0.85} onPress={() => setIsPostModalOpen(true)}>
            <Ionicons name="add-circle-outline" size={16} color={colors.textOnAccent} />
            <Text style={styles.postServiceBtnText}>Post New Service</Text>
          </TouchableOpacity>

          <View style={styles.myServicesBody}>
            {myServices.length === 0 ? (
              <>
                <View style={styles.emptyIconSmall} />
                <Text style={styles.emptyTitleSmall}>No services posted yet</Text>
                <Text style={styles.emptySubtitleSmall}>Tap "Post New Service" to list the skills you offer to clients.</Text>
              </>
            ) : (
              myServices.map((s) => (
                <View key={s.id} style={styles.serviceItem}>
                  <View style={styles.serviceRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.serviceTitle} numberOfLines={1}>{s.name || s.title}</Text>
                        <Text style={styles.servicePrice}>₱{s.price}</Text>
                      </View>
                      <View style={{ height: 8 }} />
                      <View style={styles.tagRow}>
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagText}>{s.category}</Text>
                        </View>
                      </View>
                      <Text style={styles.serviceDesc} numberOfLines={2}>{s.description}</Text>
                    </View>
                  </View>
                  <View style={styles.serviceFooter}>
                    <TouchableOpacity onPress={async () => {
                      try {
                        await servicesAPI.deleteService(s.id);
                        fetchMyServices();
                        setPostInfoModal({ visible: true, title: 'Deleted', message: 'Service removed.' });
                      } catch (e) {
                        setPostInfoModal({ visible: true, title: 'Error', message: 'Failed to delete service.' });
                      }
                    }} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </Card>
      </View>
        
        {/* Inline Post Modal (same UI as services.tsx) */}
        <AppModal
          visible={postInfoModal.visible}
          title={postInfoModal.title}
          message={postInfoModal.message}
          onClose={() => setPostInfoModal((p) => ({ ...p, visible: false }))}
        />

        <AppModal
          visible={isPostModalOpen}
          title="Post a Service"
          onClose={() => setIsPostModalOpen(false)}
          actions={[
            { label: "Cancel", type: "secondary", onPress: () => { setIsPostModalOpen(false); } },
            {
              label: "Post Service",
              type: "primary",
              onPress: async () => {
                if (!newService.name || !newService.price || !newService.description) {
                  setPostInfoModal({ visible: true, title: "Error", message: "Please fill in all fields." });
                  return false; // keep modal open
                }
                try {
                  const res = await servicesAPI.createService(newService);
                  if (res.status === "error" || res.detail) {
                    throw new Error(res.message || res.detail || JSON.stringify(res));
                  }
                  setPostInfoModal({ visible: true, title: "Success", message: "Service posted successfully!" });
                  // refresh list
                  await fetchMyServices();
                  setNewService({ name: "", category: "Cleaning", price: "", description: "" });
                  return true; // allow modal to close
                } catch (err: any) {
                  setPostInfoModal({ visible: true, title: "Error", message: `Failed to post service: ${err.message}` });
                  return false; // keep modal open so user can retry
                }
              },
            },
          ]}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>Offer your skills to homeowners</Text>
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Service Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Master Plumbing"
                placeholderTextColor={colors.textMuted}
                value={newService.name}
                onChangeText={(text) => setNewService({ ...newService, name: text })}
              />

              <View style={{ height: 14 }} />
              <Text style={styles.formLabel}>Category</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setCategoryOpen((s) => !s)}>
                <View style={[styles.dropdown, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Text style={{ color: colors.text }}>{newService.category}</Text>
                  <Ionicons name={categoryOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
              {categoryOpen && (
                <View style={{ marginTop: 6, borderRadius: 8, overflow: 'hidden', maxHeight: 160, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <ScrollView nestedScrollEnabled>
                    {CATEGORIES.filter(c => c !== newService.category).map((cat) => (
                      <TouchableOpacity key={cat} onPress={() => { setNewService({ ...newService, category: cat }); setCategoryOpen(false); }} style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ height: 14 }} />
              <Text style={styles.formLabel}>Price (₱ / hour)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 350"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={newService.price}
                onChangeText={(text) => setNewService({ ...newService, price: text })}
              />

              <View style={{ height: 14 }} />
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe what you offer..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={newService.description}
                onChangeText={(text) => setNewService({ ...newService, description: text })}
              />
            </View>
          </View>
        </AppModal>

      {/* ===== WORKFLOW OVERVIEW ===== */}
      <View style={styles.sectionArea}>
        <Text style={styles.sectionTitle}>Workflow Overview</Text>

        <View style={styles.gridContainer}>
          {/* Incoming */}
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>INCOMING</Text>
            <Text style={[styles.gridValue, { color: "#F6AD55" }]}>
              {incomingCount}
            </Text>
            <Text style={styles.gridHint}>New requests</Text>
            <Button
              title="View Requests"
              size="sm"
              type="primary"
              onPress={() => router.push("/(tabs)/bookings")}
              style={styles.gridBtn}
              textStyle={styles.gridBtnText}
            />
          </View>

          {/* Active Jobs */}
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>ACTIVE JOBS</Text>
            <Text style={[styles.gridValue, { color: colors.success }]}>
              {activeJobsCount}
            </Text>
            <Text style={styles.gridHint}>In progress</Text>
            <Button
              title="Manage Jobs"
              size="sm"
              type="primary"
              onPress={() => router.push("/(tabs)/bookings")}
              style={styles.gridBtn}
              textStyle={styles.gridBtnText}
            />
          </View>

          {/* Applications */}
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>APPLICATIONS</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>
              {appliedRequestIds.length}
            </Text>
            <Text style={styles.gridHint}>Awaiting reply</Text>
            <Button
              title="Review"
              size="sm"
              type="secondary"
              onPress={() => router.push("/(tabs)/applications")}
              style={[styles.gridBtn, styles.gridBtnOutline]}
              textStyle={styles.gridBtnOutlineText}
            />
          </View>

          {/* Completed */}
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>COMPLETED</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>
              {completedCount}
            </Text>
            <Text style={styles.gridHint}>Full history</Text>
            <Button
              title="View History"
              size="sm"
              type="secondary"
              onPress={() => router.push("/(tabs)/history")}
              style={[styles.gridBtn, styles.gridBtnOutline]}
              textStyle={styles.gridBtnOutlineText}
            />
          </View>
        </View>
      </View>

      {/* ===== RECENT REVIEWS ===== */}
      <View style={styles.sectionArea}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {recentReviews.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/reviews")}
            >
              <Text style={styles.viewLink}>See All</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {recentReviews.length > 0 ? (
          recentReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{review.name}</Text>
                <View style={styles.starsRow}>
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Text key={i} style={styles.reviewStar}>
                        ★
                      </Text>
                    ))}
                </View>
              </View>
              <Text style={styles.reviewBody}>{review.body}</Text>
              <Text style={styles.reviewTime}>{review.time}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyReviewText}>
            No recent reviews yet. Enable Mock Data in Settings to see sample
            reviews.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (
  colors: typeof import("../../constants/theme").DarkColors,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg1,
    },

    // Header Bar
    headerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
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
      fontFamily: "SpaceGrotesk_700Bold",
      fontWeight: "700",
    },
    notifBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBgSolid, // #1A1A2E
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },

    myServicesCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    myServicesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    myServicesTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15,
    },
    myServicesCount: {
      color: colors.textMuted,
      backgroundColor: colors.cardBgSolid,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      fontWeight: '700',
      fontSize: 13,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    postServiceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 10,
      marginBottom: 4,
    },
    postServiceBtnText: {
      color: colors.textOnAccent,
      fontWeight: '700',
      fontSize: 14,
    },
    myServicesBody: {
      alignItems: 'stretch',
      paddingTop: 14,
    },
    emptyIconSmall: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.cardBgSolid,
      marginBottom: 12,
    },
    emptyTitleSmall: {
      color: colors.text,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptySubtitleSmall: {
      color: colors.textMuted,
      textAlign: 'center',
    },
    formContainer: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.cardBgSolid,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    formLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    formInput: {
      backgroundColor: colors.inputBg || colors.bg1,
      borderWidth: 1,
      borderColor: colors.inputBorder || colors.cardBorder,
      padding: 12,
      borderRadius: 8,
      color: colors.text,
      width: '100%',
      fontSize: 14,
    },
    dropdown: {
      borderWidth: 1,
      borderColor: colors.inputBorder || colors.cardBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: 'transparent',
    },
    dropdownOption: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    dropdownOptionText: {
      color: colors.text,
    },
    serviceItem: {
      width: '100%',
      backgroundColor: colors.cardBgSolid,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 12,
    },
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    serviceTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15,
    },
    servicePrice: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
    tagRow: {
      marginTop: 6,
      marginBottom: 8,
    },
    tagBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      color: colors.textOnAccent,
      fontSize: 12,
      fontWeight: '700',
    },
    serviceDesc: {
      color: colors.textMuted,
      marginTop: 4,
    },
    serviceFooter: {
      marginTop: 10,
      alignItems: 'flex-end',
    },
    deleteBtn: {
      borderWidth: 1,
      borderColor: colors.danger,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    deleteBtnText: {
      color: colors.danger,
      fontWeight: '700',
    },

    // Status Pill
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    statusOnline: {
      backgroundColor: `${colors.success}26`,
      borderColor: `${colors.success}40`,
    },
    statusOffline: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderColor: colors.cardBorder,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    dotOnline: {
      backgroundColor: colors.success,
    },
    dotOffline: {
      backgroundColor: colors.textMuted,
    },
    statusPillText: {
      fontSize: 12,
      fontFamily: "DMSans_600SemiBold",
      fontWeight: "700",
    },
    textOnline: {
      color: colors.success,
    },
    textOffline: {
      color: colors.textMuted,
    },

    // Greeting Area
    greetingSection: {
      paddingHorizontal: 20,
      paddingTop: 10,
      marginBottom: 24,
    },
    greetingLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: "SpaceGrotesk_700Bold",
      fontWeight: "700",
      letterSpacing: 1.2,
      marginBottom: 6,
    },
    greetingName: {
      color: colors.text,
      fontSize: 32,
      fontFamily: "SpaceGrotesk_700Bold",
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    greetingSubtitle: {
      color: colors.textMuted,
      fontSize: 15,
      fontFamily: "DMSans_400Regular",
    },

    // Stats Scroll
    statsScroll: {
      marginBottom: 32,
    },
    statsScrollContent: {
      paddingHorizontal: 20,
      gap: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 12,
    },
    statCardGrid: {
      flex: 1,
      marginRight: 8,
      backgroundColor: colors.cardBgSolid,
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      minWidth: 0,
    },
    statCard: {
      width: 120,
      backgroundColor: colors.cardBgSolid, // #1A1A2E
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    statValRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 6,
    },
    statVal: {
      color: colors.text,
      fontSize: 24,
      fontFamily: "SpaceGrotesk_700Bold",
      fontWeight: "700",
    },
    statSuffix: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: "DMSans_600SemiBold",
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: "DMSans_500Medium",
    },

    // Sections
    sectionArea: {
      paddingHorizontal: 20,
      marginBottom: 32,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontFamily: "SpaceGrotesk_700Bold",
      fontWeight: "700",
      marginBottom: 16,
    },
    viewLink: {
      color: colors.accent,
      fontSize: 13,
      fontFamily: "DMSans_500Medium",
    },

    // 2x2 Grid
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      justifyContent: "space-between",
    },
    gridCard: {
      width: "47.5%",
      backgroundColor: colors.cardBgSolid, // #1A1A2E
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: "flex-start",
    },
    gridLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: "DMSans_600SemiBold",
      fontWeight: "700",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    gridValue: {
      fontSize: 32,
      fontFamily: "SpaceGrotesk_700Bold",
      fontWeight: "700",
      marginBottom: 4,
    },
    gridHint: {
      color: colors.accent,
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
      marginBottom: 16,
    },
    gridBtn: {
      width: "100%",
      borderRadius: 10,
      minHeight: 36,
      paddingVertical: 8,
    },
    gridBtnText: {
      fontSize: 12,
      fontFamily: "DMSans_600SemiBold",
    },
    gridBtnOutline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    gridBtnOutlineText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: "DMSans_600SemiBold",
    },

    // Review Cards
    reviewCard: {
      backgroundColor: colors.cardBgSolid,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    reviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    reviewName: {
      color: colors.text,
      fontSize: 15,
      fontFamily: "DMSans_600SemiBold",
      fontWeight: "600",
    },
    starsRow: {
      flexDirection: "row",
      gap: 2,
    },
    reviewStar: {
      color: "#F6AD55", // gold star
      fontSize: 14,
    },
    reviewBody: {
      color: colors.text,
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
      lineHeight: 22,
      marginBottom: 12,
    },
    reviewTime: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
    },
    emptyReviewText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      marginTop: 12,
      paddingHorizontal: 20,
    },
  });


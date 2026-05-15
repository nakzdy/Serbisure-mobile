import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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
import AppModal from "../../components/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { useBookings } from "../../contexts/BookingsContext";
import { useRequests } from "../../contexts/RequestsContext";
import { useTheme } from "../../contexts/ThemeContext";
import { WORKERS as MOCK_WORKERS } from "../../data/workers";
import { bookingsAPI, servicesAPI } from "../../services/api";

export default function ServicesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{ book?: string; post?: string }>();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingWorker, setBookingWorker] = useState<any | null>(null);
  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: "",
    message: "",
  });
  const { bookings, addBooking } = useBookings();
  const { addRequest } = useRequests();
  const insets = useSafeAreaInsets();

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    category: "Cleaning",
    price: "",
    description: "",
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await servicesAPI.getServices();
      if (Array.isArray(data)) {
        // Map Django Services to Mobile Worker structure
        const mapped = data.map((s: any) => ({
          id: s.id.toString(),
          provider_id: s.provider?.id || s.provider,
          name: s.provider?.full_name || s.name,
          skills: [s.category],
          reliability: 90, // Placeholder
          verified: true,
          tesda: true,
          description: s.description,
          price: s.price,
        }));
        setWorkers(mapped);
      } else {
        setWorkers(MOCK_WORKERS);
      }
    } catch (err) {
      console.warn("Failed to fetch services, using mock data.");
      setWorkers(MOCK_WORKERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    // If navigated with ?post=1 open the post modal and clean the URL
    if (params.post && (params.post === '1' || params.post === 'true')) {
      setIsPostModalOpen(true);
      try {
        router.replace('/(tabs)/services');
      } catch (e) {
        // ignore
      }
    }
  }, [params.post]);

  const filteredWorkers = useMemo(() => {
    // If user is a worker, show only their own services
    if (user?.role === "worker") {
      return workers.filter(
        (w) =>
          w.provider_id === user.uid ||
          w.provider_id === parseInt(user.uid as string),
      );
    }

    const matchCategory = (worker: any) =>
      selectedCategory === "All" ||
      worker.skills.some((skill: string) =>
        skill.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    const matchSearch = (worker: any) =>
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.skills.some((skill: string) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return workers.filter(
      (worker) => matchCategory(worker) && matchSearch(worker),
    );
  }, [selectedCategory, searchQuery, workers, user]);

  useEffect(() => {
    if (params.book && workers.length > 0) {
      const worker = workers.find((w) => w.id === params.book);
      if (worker) {
        setBookingWorker(worker);
      }
    }
  }, [params.book, workers]);

  const handlePostService = async () => {
    if (!newService.name || !newService.price || !newService.description) {
      setInfoModal({
        visible: true,
        title: "Error",
        message: "Please fill in all fields.",
      });
      return;
    }

    try {
      const res = await servicesAPI.createService(newService);
      if (res.status === "error" || res.detail) {
        throw new Error(res.message || res.detail || JSON.stringify(res));
      }
      setInfoModal({
        visible: true,
        title: "Success",
        message: "Service posted successfully!",
      });
      setIsPostModalOpen(false);
      setNewService({
        name: "",
        category: "Cleaning",
        price: "",
        description: "",
      });
      fetchServices();
    } catch (err: any) {
      console.warn("Failed to post service:", err.message);
      setInfoModal({
        visible: true,
        title: "Error",
        message: `Failed to post service: ${err.message}`,
      });
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await servicesAPI.deleteService(id);
      setInfoModal({
        visible: true,
        title: "Deleted",
        message: "Service removed successfully.",
      });
      fetchServices();
    } catch (err) {
      setInfoModal({
        visible: true,
        title: "Error",
        message: "Failed to delete service.",
      });
    }
  };

  const handleBookService = async (
    workerId: string,
    workerName: string,
    skills: string[],
    reliability: number,
  ) => {
    const alreadyBooked = bookings.some(
      (b) => b.workerId === workerId && b.status !== "Cancelled",
    );
    if (alreadyBooked) return;

    // 1. Sync with API (Task 5/7 Requirement)
    let bookingId = `${workerId}-${Date.now()}`;
    try {
      const res = await bookingsAPI.createBooking({
        service: parseInt(workerId, 10),
        scheduled_date: new Date().toISOString().split("T")[0], // Today's date
      });
      if (res.status === "error" || res.detail) {
        throw new Error(res.message || res.detail || JSON.stringify(res));
      }
      if (res.data?.id) {
        bookingId = res.data.id.toString();
      }
    } catch (apiErr: any) {
      console.warn("Failed to create booking:", apiErr.message);
      setInfoModal({
        visible: true,
        title: "Network Error",
        message: `Could not create booking: ${apiErr.message}`,
      });
      return;
    }

    const requestId = `req-${Date.now()}`;
    addRequest({
      id: requestId,
      title: skills[0] || "Service Request",
      category: skills[0] || "General",
      date: new Date().toLocaleString(),
      est: "TBD",
      homeownerName: user?.name || "Homeowner",
      status: "Confirmed",
    });
    addBooking({
      id: bookingId,
      workerId,
      workerName,
      homeownerName: user?.name || "Homeowner",
      skills,
      reliability,
      requestId,
      serviceType: skills[0] || "Service Request",
      serviceDate: new Date().toLocaleString(),
      estimatedCost: "TBD",
      createdAt: new Date().toLocaleString(),
      status: "Confirmed",
    });
    setBookingWorker(null);
    setInfoModal({
      visible: true,
      title: "Booking Confirmed",
      message: `Your booking with ${workerName} is confirmed.`,
    });
    router.push("/(tabs)/bookings");
  };

  const renderWorker = (item: any) => (
    <Card style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{item.name}</Text>
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedText}>₱{item.price}</Text>
          </View>
        </View>
      </View>

      <View style={styles.skillsRow}>
        {item.skills.map((skill: string) => (
          <View key={skill} style={styles.skillBadge}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>
        {item.description}
      </Text>

      {user?.role === "worker" ? (
        <Button
          title="Delete Service"
          type="outline"
          onPress={() => handleDeleteService(item.id)}
          style={{ borderColor: colors.danger }}
          textStyle={{ color: colors.danger }}
        />
      ) : (
        <Button
          title={
            bookings.some(
              (b) => b.workerId === item.id && b.status !== "Cancelled",
            )
              ? "Booked"
              : "Book Service"
          }
          onPress={() => setBookingWorker(item)}
          style={styles.bookButton}
          disabled={bookings.some(
            (b) => b.workerId === item.id && b.status !== "Cancelled",
          )}
        />
      )}
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 20, paddingBottom: 100 },
      ]}
    >
      <AppModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        onClose={() => setInfoModal((prev) => ({ ...prev, visible: false }))}
      />

      <AppModal
        visible={isPostModalOpen}
        title="Post a Service"
        onClose={() => setIsPostModalOpen(false)}
        actions={[
          { label: "Cancel", type: "secondary", onPress: () => setIsPostModalOpen(false) },
          { label: "Post Service", type: "primary", onPress: handlePostService },
        ]}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Offer your skills to homeowners</Text>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Master Plumbing"
              placeholderTextColor={colors.textMuted}
              value={newService.name}
              onChangeText={(text) => setNewService({ ...newService, name: text })}
            />

            <View style={{ height: 10 }} />
            <TextInput
              style={styles.formInput}
              placeholder="Cleaning"
              placeholderTextColor={colors.textMuted}
              value={newService.category}
              onChangeText={(text) => setNewService({ ...newService, category: text })}
            />

            <View style={{ height: 10 }} />
            <TextInput
              style={styles.formInput}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={newService.price}
              onChangeText={(text) => setNewService({ ...newService, price: text })}
            />

            <View style={{ height: 10 }} />
            <TextInput
              style={[styles.formInput, { height: 120 }]}
              placeholder="Describe what you offer..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={newService.description}
              onChangeText={(text) => setNewService({ ...newService, description: text })}
            />
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={!!bookingWorker}
        title="Confirm Booking"
        onClose={() => setBookingWorker(null)}
        actions={[
          {
            label: "Confirm",
            type: "primary",
            onPress: () =>
              bookingWorker &&
              handleBookService(
                bookingWorker.id,
                bookingWorker.name,
                bookingWorker.skills,
                bookingWorker.reliability,
              ),
          },
          { label: "Cancel", type: "secondary" },
        ]}
      >
        {bookingWorker && (
          <View style={styles.modalBlock}>
            <Text style={styles.modalTitle}>Book {bookingWorker.name}</Text>
            <Text style={styles.modalLine}>
              Service types: {bookingWorker.skills.join(", ")}
            </Text>
            <Text style={styles.modalLine}>
              Reliability score: {bookingWorker.reliability}%
            </Text>
            <Text style={styles.modalLine}>
              We will confirm your schedule after the worker accepts.
            </Text>
          </View>
        )}
      </AppModal>

      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.role === "worker" ? "My Services" : "Browse Services"}
        </Text>
        <Text style={styles.subtitle}>
          {user?.role === "worker"
            ? "Manage the skills and services you offer to homeowners"
            : "Find and book verified service providers for your home"}
        </Text>
        <View style={styles.headerActions}>
          {(user?.role === "worker" || user?.role === 'service_worker') ? (
            <Button
              title="+ Post New Service"
              onPress={() => setIsPostModalOpen(true)}
            />
          ) : (
            <Button
              title="View Bookings"
              type="outline"
              onPress={() => router.push("/(tabs)/bookings")}
            />
          )}
        </View>
      </View>

      {user?.role !== "worker" && (
        <>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search by name or skill..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categories}
            >
              {[
                "All",
                "Plumbing",
                "Electrical",
                "Cleaning",
                "Carpentry",
                "Babysitting",
                "Pet Care",
                "General Help",
              ].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBadge,
                    selectedCategory === cat && styles.categoryActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat && styles.categoryActiveText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      <View style={styles.gridSection}>
        {filteredWorkers.length > 0 ? (
          filteredWorkers.map((worker) => (
            <View key={worker.id} style={styles.gridItem}>
              {renderWorker(worker)}
            </View>
          ))
        ) : (
          (user?.role === "worker" || user?.role === 'service_worker') ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyInner}>
                <View style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No services posted yet</Text>
                <Text style={styles.emptySubtitle}>Tap "Post New Service" to list the skills you offer to clients.</Text>
                <View style={{ height: 12 }} />
                <Button title="+ Post New Service" onPress={() => setIsPostModalOpen(true)} />
              </View>
            </Card>
          ) : (
            <Text style={styles.noResults}>
              {`No workers found for '${selectedCategory}'.`}
            </Text>
          )
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
    scrollContent: {
      paddingHorizontal: 20,
    },
    header: {
      marginBottom: 24,
    },
    headerActions: {
      marginTop: 12,
      maxWidth: 180,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
    },
    searchSection: {
      marginBottom: 20,
    },
    searchBar: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      padding: 14,
      color: colors.text,
    },
    section: {
      marginBottom: 24,
    },
    categories: {
      flexDirection: "row",
    },
    categoryBadge: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.cardBg,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    categoryActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    categoryText: {
      color: colors.textMuted,
      fontWeight: "600",
      fontSize: 13,
    },
    categoryActiveText: {
      color: colors.textOnAccent,
    },
    gridSection: {
      marginBottom: 40,
    },
    gridItem: {
      marginBottom: 16,
    },
    workerCard: {
      padding: 20,
      borderRadius: 12,
    },
    workerHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.cardBgSolid,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    avatarText: {
      color: colors.textMuted,
      fontSize: 20,
      fontWeight: "700",
    },
    workerInfo: {
      flex: 1,
    },
    workerName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
      flexWrap: "wrap",
    },
    verifiedRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    verifiedText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "600",
    },
    pendingText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    reliabilityBadge: {
      alignItems: "flex-end",
    },
    reliabilityScore: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: "700",
    },
    reliabilityLabel: {
      color: colors.textMuted,
      fontSize: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    skillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
      gap: 6,
    },
    skillBadge: {
      backgroundColor: colors.statusPending,
      borderWidth: 1,
      borderColor: colors.statusPendingBorder,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    skillText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "500",
    },
    tesdaRow: {
      marginBottom: 20,
    },
    tesdaText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "600",
    },
    noTesdaText: {
      color: colors.muted,
      fontSize: 12,
    },
    bookButton: {
      width: "100%",
    },
    noResults: {
      color: colors.textMuted,
      textAlign: "center",
      paddingVertical: 32,
      fontSize: 14,
    },
    emptyCard: {
      padding: 28,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 24,
    },
    emptyInner: {
      alignItems: 'center',
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.cardBgSolid,
      marginBottom: 12,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptySubtitle: {
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 8,
    },
    modalBlock: {
      gap: 8,
    },
    formContainer: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.cardBgSolid,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    formInput: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      padding: 12,
      borderRadius: 8,
      color: colors.text,
    },
    modalTitle: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 16,
    },
    modalLine: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });

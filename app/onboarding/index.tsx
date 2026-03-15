import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card, Input } from '../../components/CommonUI';
import AppModal from '../../components/Modal';
import { db } from '../../constants/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function OnboardingScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [step, setStep] = useState(1);
    const [skills, setSkills] = useState(user?.skills || '');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    const openModal = (title: string, message: string) => {
        setModal({ visible: true, title, message });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, visible: false }));
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, {
                skills,
                bio,
                isWorkerOnboarded: true,
                workerProfile: {
                    skills: skills.split(',').map((s: string) => s.trim()),
                    bio
                }
            });
            openModal('Success', 'Onboarding completed!');
            router.replace('/(tabs)/explore');
        } catch (error: any) {
            openModal('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <AppModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
            />
            <View style={styles.header}>
                <Text style={styles.title}>Worker Onboarding</Text>
                <Text style={styles.subtitle}>Step {step} of 2</Text>
            </View>

            {step === 1 ? (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>What are your skills?</Text>
                    <Text style={styles.sectionDesc}>List your professional expertise (separated by commas)</Text>
                    <Input
                        placeholder="e.g. Plumbing, Electrical, Cleaning"
                        value={skills}
                        onChangeText={setSkills}
                    />
                    <Button title="Next Step" onPress={() => setStep(2)} />
                </Card>
            ) : (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Tell us about yourself</Text>
                    <Text style={styles.sectionDesc}>Briefly describe your experience and work ethic</Text>
                    <View style={styles.textAreaRow}>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={4}
                            placeholder="Your bio..."
                            placeholderTextColor={colors.textMuted}
                            value={bio}
                            onChangeText={setBio}
                        />
                    </View>
                    <View style={styles.actionRow}>
                        <Button style={{ flex: 1, marginRight: 8 }} type="secondary" title="Back" onPress={() => setStep(1)} />
                        <Button style={{ flex: 2 }} title={loading ? "Finishing..." : "Complete Profile"} onPress={handleComplete} disabled={loading} />
                    </View>
                </Card>
            )}
        </ScrollView>
    );
}

const createStyles = (colors: typeof import('../../constants/theme').DarkColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg1,
        padding: 20,
    },
    header: {
        marginTop: 40,
        marginBottom: 24,
    },
    title: {
        color: colors.text,
        fontSize: 28,
        fontWeight: '700',
    },
    subtitle: {
        color: colors.accent,
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        width: '100%',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionDesc: {
        color: colors.textMuted,
        fontSize: 14,
        marginBottom: 20,
    },
    textAreaRow: {
        marginBottom: 20,
    },
    textArea: {
        backgroundColor: colors.inputBg,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: 10,
        padding: 13,
        color: colors.text,
        fontSize: 14,
        height: 120,
        textAlignVertical: 'top',
    },
    actionRow: {
        flexDirection: 'row',
    }
});

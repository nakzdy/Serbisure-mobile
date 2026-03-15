import { Picker } from '@react-native-picker/picker';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card, Input } from '../../components/CommonUI';
import AppModal from '../../components/Modal';
import { auth, db } from '../../constants/firebase';
import { useTheme } from '../../contexts/ThemeContext';

export default function RegisterScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Homeowner');
    const [skill, setSkill] = useState('Plumbing');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    const openModal = (title: string, message: string) => {
        setModal({ visible: true, title, message });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, visible: false }));
    };

    const handleRegister = async () => {
        if (!name || !email || !password || (role === 'Service Worker' && !skill)) {
            openModal('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });

            const isWorker = role === 'Service Worker';
            const profileData = {
                name,
                role: isWorker ? "worker" : "homeowner",
                skills: isWorker ? skill : "",
                isWorkerOnboarded: isWorker,
                workerProfile: isWorker ? { skills: [skill] } : null
            };

            await setDoc(doc(db, "users", userCredential.user.uid), profileData);

            openModal('Success', `Welcome to SerbiSure, ${name}!`);
            router.replace('/(tabs)');
        } catch (error: any) {
            openModal('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <AppModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>SerbiSure</Text>
                    <Text style={styles.subtitle}>Mobile</Text>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.formTitle}>Register</Text>
                    <Text style={styles.formSubtitle}>Create your account</Text>

                    <Input
                        label="Full Name"
                        placeholder="Juana Dela Cruz"
                        value={name}
                        onChangeText={setName}
                    />

                    <Input
                        label="Email"
                        placeholder="your@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />

                    <View style={styles.pickerRow}>
                        <Text style={styles.label}>I am a...</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={role}
                                onValueChange={(itemValue) => setRole(itemValue)}
                                style={styles.picker}
                                dropdownIconColor={colors.text}
                            >
                                <Picker.Item label="Homeowner" value="Homeowner" color={colors.accent} />
                                <Picker.Item label="Service Worker" value="Service Worker" color={colors.accent} />
                            </Picker>
                        </View>
                    </View>

                    {role === 'Service Worker' && (
                        <View style={styles.pickerRow}>
                            <Text style={styles.label}>Primary Skill</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={skill}
                                    onValueChange={(itemValue) => setSkill(itemValue)}
                                    style={styles.picker}
                                    dropdownIconColor={colors.text}
                                >
                                    {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Babysitting', 'Pet Care', 'General Help'].map(cat => (
                                        <Picker.Item key={cat} label={cat} value={cat} color={colors.accent} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    )}

                    <Input
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title={loading ? "Registering..." : "Register"}
                        onPress={handleRegister}
                        disabled={loading}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href="/auth/login" asChild>
                            <Text style={styles.linkText}>Log in here</Text>
                        </Link>
                    </View>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: typeof import('../../constants/theme').DarkColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: colors.bg1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: colors.accent,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        color: colors.textMuted,
        fontWeight: '500',
    },
    card: {
        width: '100%',
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 14,
        color: colors.muted,
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.muted,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    pickerRow: {
        marginBottom: 16,
    },
    pickerWrapper: {
        backgroundColor: colors.inputBg,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    picker: {
        color: colors.text,
        height: 50,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: colors.textMuted,
        fontSize: 14,
    },
    linkText: {
        color: colors.accent,
        fontWeight: '600',
        fontSize: 14,
    }
});

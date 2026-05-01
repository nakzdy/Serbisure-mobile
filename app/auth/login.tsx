import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card, Input } from '../../components/CommonUI';
import AppModal from '../../components/Modal';
import { auth, db } from '../../constants/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authAPI } from '../../services/api';
// import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';

// WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { colors } = useTheme();
    const { setManualAuthActive, setUser } = useAuth();
    const styles = createStyles(colors);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Homeowner');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    // Google Auth Request
    // Google Auth Request
    /*
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: "933039253892-2398p5hgkg2d1fjtjtkn6mtt498100mi.apps.googleusercontent.com",
        iosClientId: "933039253892-2398p5hgkg2d1fjtjtkn6mtt498100mi.apps.googleusercontent.com",
        webClientId: "933039253892-2398p5hgkg2d1fjtjtkn6mtt498100mi.apps.googleusercontent.com",
    });
    */

    const openModal = (title: string, message: string) => {
        setModal({ visible: true, title, message });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, visible: false }));
    };

    // Handle Google Auth Response
    /*
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleSync(id_token);
        } else if (response?.type === 'error' || response?.type === 'cancel') {
            setLoading(false);
            setManualAuthActive(false);
        }
    }, [response]);
    */

    const handleGoogleSync = async (idToken: string) => {
        setLoading(true);
        setManualAuthActive(true);
        try {
            // 1. Sign in to Firebase with Google Credential
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const firebaseUser = userCredential.user;

            // 2. Check Firestore for role
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists() || !docSnap.data().role) {
                // Not registered yet — same as web behavior
                openModal(
                    'No Account Found',
                    'We found your Google account, but no SerbiSure profile is linked to it. Please Register first.'
                );
                await auth.signOut();
                setLoading(false);
                setManualAuthActive(false);
                return;
            }

            const profile = docSnap.data();

            // 3. Sync with Django Backend (Match web logic)
            const djangoData = await authAPI.googleSync({
                email: firebaseUser.email,
                password: firebaseUser.uid, // Using UID as placeholder password like in web
                full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                role: profile.role === 'worker' ? 'service_worker' : 'homeowner'
            });

            if (djangoData.status !== 'success') {
                throw new Error(djangoData.message || 'Django Sync failed');
            }

            // Success!
            setManualAuthActive(false);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error("Google Login Error:", error);
            openModal('Google Sync Failed', error.message || 'Could not synchronize with the system.');
            await auth.signOut();
            setManualAuthActive(false);
        } finally {
            setLoading(false);
        }
    };

    /*
    const handleGoogleLogin = async () => {
        setLoading(true);
        setManualAuthActive(true);
        promptAsync();
    };
    */

    const handleLogin = async () => {
        if (!email || !password) {
            openModal('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        setManualAuthActive(true); // Prevent _layout.tsx from auto-redirecting
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const isWorkerSelection = role === 'Service Worker';
            const expectedRole = isWorkerSelection ? 'worker' : 'homeowner';

            // 1. Fetch Firestore profile and validate role (Legacy/Local Check)
            const docRef = doc(db, 'users', userCredential.user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                openModal('Account Error', 'No account profile found. Please register first.');
                await auth.signOut();
                setLoading(false);
                setManualAuthActive(false);
                return;
            }

            const actualRole: string = docSnap.data().role;

            if (actualRole !== expectedRole) {
                const registeredAs = actualRole === 'worker' ? 'Service Worker' : 'Homeowner';
                const selectedAs = isWorkerSelection ? 'Service Worker' : 'Homeowner';
                
                openModal(
                    'Wrong Role Selected',
                    `You selected "${selectedAs}" but this account is registered as a "${registeredAs}". Please choose the correct role and try again.`
                );
                await auth.signOut();
                setLoading(false);
                setManualAuthActive(false);
                return;
            }

            // 2. Sync with Django Backend (Task 5 Requirement)
            try {
                const djangoData = await authAPI.login({ email, password });
                if (djangoData?.status === 'error' || (!djangoData?.token && !djangoData?.data?.token)) {
                    throw new Error(djangoData?.message || 'Django Auth failed');
                }
            } catch (apiErr) {
                console.warn("Backend sync failed, but Firebase succeeded. Attempting to auto-sync missing Neon account...");
                try {
                    // Automatically create the stranded user in Neon DB
                    await authAPI.register({
                        email,
                        password,
                        full_name: docSnap.data().name || email.split('@')[0],
                        role: expectedRole === 'worker' ? 'service_worker' : 'homeowner'
                    });
                    // Re-attempt login to get token
                    await authAPI.login({ email, password });
                } catch (syncErr) {
                    console.error("Auto-sync failed:", syncErr);
                    throw new Error("Account exists in Firebase but could not be synchronized to the main database.");
                }
            }

            // Validation passed! Allow router to navigate explicitly
            const profileData = docSnap.data() || {};
            setUser({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                name: profileData.name || userCredential.user.displayName || profileData.full_name || email.split('@')[0],
                ...profileData,
                role: expectedRole
            });
            setManualAuthActive(false);
            router.replace('/(tabs)');
        } catch (error: any) {
            openModal('Login Failed', error.message);
            setManualAuthActive(false);
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
                    <Text style={styles.formTitle}>Login</Text>
                    <Text style={styles.formSubtitle}>Access your account</Text>

                    <Input
                        label="Email"
                        placeholder="your@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />

                    <View style={styles.pickerRow}>
                        <Text style={styles.label}>Login As</Text>
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

                    <Input
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title={loading ? "Signing in..." : "Log In"}
                        onPress={handleLogin}
                        disabled={loading}
                        style={styles.loginBtn}
                    />

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.divider} />
                    </View>

                    <Button
                        title="Create New Account"
                        type="outline"
                        onPress={() => router.push('/auth/register')}
                        disabled={loading}
                    />

                    {/*
                    <Button
                        title="Log in with Google"
                        onPress={handleGoogleLogin}
                        disabled={loading || !request}
                        style={{ marginTop: 12, backgroundColor: '#fff', borderColor: colors.cardBorder, borderWidth: 1 }}
                        textStyle={{ color: '#000' }}
                    />
                    */}
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    loginBtn: {
        marginBottom: 16,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.cardBorder,
    },
    dividerText: {
        color: colors.muted,
        paddingHorizontal: 16,
        fontSize: 12,
        fontWeight: '700',
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

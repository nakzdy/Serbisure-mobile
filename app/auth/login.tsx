import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { Button } from '../../components/Button';
import { Card, Input } from '../../components/CommonUI';
import { GradientText } from '../../components/GradientText';
import AppModal from '../../components/Modal';
// Firebase removed for mobile; use Django APIs only
import { useAuth } from '../../contexts/AuthContext';
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



    const handleLogin = async () => {
        if (!email || !password) {
            openModal('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        setManualAuthActive(true); // Prevent _layout.tsx from auto-redirecting

        try {
            const isWorkerSelection = role === 'Service Worker';
            const expectedRole = isWorkerSelection ? 'worker' : 'homeowner';

            // 1. Try Django auth first (primary source)
            let djangoOk = false;
            let djangoData: any = null;
            try {
                djangoData = await authAPI.login({ email, password });
                if (djangoData && (djangoData.status === 'success' || djangoData.token || djangoData.data?.token || djangoData.user)) {
                    djangoOk = true;
                }
            } catch (djErr: any) {
                djangoOk = false;
                djangoData = null;
                if (djErr && djErr.message && djErr.message.toLowerCase().includes('network')) {
                    throw new Error('Unable to connect to the server. Please check your network connection and try again.');
                }
            }

            if (djangoOk && djangoData) {
                const djangoUser = djangoData.data?.user || djangoData.data || djangoData.user || djangoData;
                // Validate role selection
                if (djangoUser.role === 'service_worker' && !isWorkerSelection) {
                    openModal('Wrong Role Selected', `You selected "${isWorkerSelection ? 'Service Worker' : 'Homeowner'}" but this account is registered as a "Service Worker". Please choose the correct role and try again.`);
                    setManualAuthActive(false);
                    setLoading(false);
                    return;
                }
                if (djangoUser.role !== 'service_worker' && isWorkerSelection) {
                    openModal('Wrong Role Selected', `You selected "Service Worker" but this account is registered as a "Homeowner". Please choose the correct role and try again.`);
                    setManualAuthActive(false);
                    setLoading(false);
                    return;
                }

                setUser({
                    uid: djangoUser.id || email,
                    email: djangoUser.email || email,
                    name: djangoUser.full_name || email.split('@')[0],
                    role: djangoUser.role === 'service_worker' ? 'worker' : 'homeowner'
                });
                setManualAuthActive(false);
                router.replace('/(tabs)');
                return;
            }

            // If we reach here, Django auth failed (not a network error)
            throw new Error('Login failed. Please check your credentials.');
        } catch (error: any) {
            const code = error?.code || error?.message || String(error);
            openModal('Login Failed', code);
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
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <GradientText style={styles.title}>SerbiSure</GradientText>
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
    logoImage: {
        width: 80,
        height: 80,
        marginBottom: 12,
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

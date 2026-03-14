import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { Card, Input } from '../../../components/CommonUI';
import { auth } from '../../../constants/firebase';
import { Theme } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';

export default function SettingsScreen() {
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [language, setLanguage] = useState('English');
    const insets = useSafeAreaInsets();

    const handleChangePicture = () => {
        Alert.alert('Change Picture', 'This feature is coming soon (Image picker integration).');
    };

    const handleSaveChanges = () => {
        Alert.alert('Settings Saved', `Dark mode: ${darkMode ? 'Enabled' : 'Disabled'}\nLanguage: ${language}`);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Update your account and app preferences</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Picture</Text>
                <Card style={styles.settingsCard}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                        </View>
                        <Button title="Change Picture" size="sm" onPress={handleChangePicture} style={styles.changePicBtn} />
                    </View>
                </Card>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Information</Text>
                <Card style={styles.settingsCard}>
                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                    <View style={styles.inputWrapper}>
                        <Input
                            value={user?.email || "user@example.com"}
                            onChangeText={() => { }}
                            editable={false}
                        />
                    </View>

                    <Text style={styles.label}>NEW PASSWORD</Text>
                    <View style={styles.inputWrapper}>
                        <Input
                            value={newPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            onChangeText={setNewPassword}
                        />
                    </View>

                    <Text style={styles.label}>LANGUAGE</Text>
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity onPress={() => {
                            const next = language === 'English' ? 'Filipino' : 'English';
                            setLanguage(next);
                            Alert.alert('Language changed', `Selected: ${next}`);
                        }} style={styles.langSelect}>
                            <Text style={styles.langText}>{language} ˅</Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <Card style={styles.settingsCard}>
                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>Appearance</Text>
                        <View style={styles.toggleGroup}>
                            <Text style={styles.toggleLabel}>Dark Mode</Text>
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#4A5568', true: Theme.colors.accent }}
                                thumbColor={'#FFF'}
                            />
                        </View>
                    </View>
                    <View style={styles.prefDivider} />
                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>Language</Text>
                        <View style={styles.langSelect}>
                            <Text style={styles.langText}>English   ˅</Text>
                        </View>
                    </View>
                </Card>
            </View>
            <View style={styles.actionSection}>
                <Button title="Save Changes" onPress={handleSaveChanges} style={styles.saveBtn} />
                <Button title="Log Out" type="secondary" onPress={handleLogout} style={styles.logoutBtn} textStyle={styles.logoutText} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.bg1,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Theme.colors.text,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: Theme.colors.textMuted,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    settingsCard: {
        padding: 24,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 24,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '700',
    },
    changePicBtn: {
        flex: 1,
    },
    label: {
        color: Theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    prefRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    prefLabel: {
        color: Theme.colors.text,
        fontSize: 15,
        fontWeight: '500',
    },
    toggleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        color: Theme.colors.accent,
        fontSize: 13,
    },
    langSelect: {
        backgroundColor: Theme.colors.inputBg,
        borderWidth: 1,
        borderColor: Theme.colors.inputBorder,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    langText: {
        color: Theme.colors.text,
        fontSize: 13,
    },
    prefDivider: {
        height: 1,
        backgroundColor: Theme.colors.cardBorder,
        marginVertical: 4,
    },
    actionSection: {
        marginTop: 8,
        marginBottom: 20,
        gap: 16,
    },
    saveBtn: {
        width: '100%',
    },
    logoutBtn: {
        width: '100%',
    },
    logoutText: {
        color: '#FC8181', // subtle red for logout
        fontWeight: '700',
    }
});

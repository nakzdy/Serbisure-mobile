import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { Card, Input } from '../../../components/CommonUI';
import AppModal from '../../../components/Modal';
import { auth } from '../../../constants/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';

export default function SettingsScreen() {
    const { user } = useAuth();
    const { colors, darkMode, setDarkMode } = useTheme();
    const { settings, setLanguage, setAvatarColor } = useSettings();
    const styles = createStyles(colors);
    const [newPassword, setNewPassword] = useState('');
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const insets = useSafeAreaInsets();

    const openModal = (title: string, message: string) => {
        setModal({ visible: true, title, message });
    };

    const closeModal = () => setModal(prev => ({ ...prev, visible: false }));

    const handleChangePicture = () => {
        setShowAvatarModal(true);
    };

    const handleSaveChanges = () => {
        openModal('Settings Saved', `Dark mode: ${darkMode ? 'Enabled' : 'Disabled'}\nLanguage: ${settings.language}`);
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
            <AppModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
            />
            <AppModal
                visible={showLanguageModal}
                title="Select Language"
                onClose={() => setShowLanguageModal(false)}
                actions={[
                    { label: 'English', type: 'primary', onPress: () => setLanguage('English') },
                    { label: 'Filipino', type: 'secondary', onPress: () => setLanguage('Filipino') },
                ]}
            >
                <Text style={styles.modalText}>Choose the language you want to use across the app.</Text>
            </AppModal>
            <AppModal
                visible={showAvatarModal}
                title="Choose Avatar Color"
                onClose={() => setShowAvatarModal(false)}
                actions={[{ label: 'Done', type: 'primary' }]}
            >
                <View style={styles.avatarOptions}>
                    {['#638cff', '#4cd137', '#f39c12', '#e74c3c', '#9b59b6'].map(color => (
                        <TouchableOpacity
                            key={color}
                            style={[styles.avatarOption, { backgroundColor: color, borderColor: settings.avatarColor === color ? '#FFF' : 'transparent' }]}
                            onPress={() => setAvatarColor(color)}
                        />
                    ))}
                </View>
                <Text style={styles.modalText}>Selected color will be applied to your profile avatar.</Text>
            </AppModal>

            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Update your account and app preferences</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Picture</Text>
                <Card style={styles.settingsCard}>
                    <View style={styles.profileRow}>
                        <View style={[styles.avatar, { backgroundColor: settings.avatarColor || colors.accent }]}>
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
                            value={user?.email || 'user@example.com'}
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
                        <TouchableOpacity onPress={() => setShowLanguageModal(true)} style={styles.langSelect}>
                            <Text style={styles.langText}>{settings.language} ▾</Text>
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
                            <Text style={styles.toggleLabel}>{darkMode ? 'Dark Mode' : 'Light Mode'}</Text>
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: colors.cardBorder, true: colors.accent }}
                                thumbColor={'#FFF'}
                            />
                        </View>
                    </View>
                    <View style={styles.prefDivider} />
                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>Language</Text>
                        <TouchableOpacity style={styles.langSelect} onPress={() => setShowLanguageModal(true)}>
                            <Text style={styles.langText}>{settings.language} ▾</Text>
                        </TouchableOpacity>
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

const createStyles = (colors: typeof import('../../../constants/theme').DarkColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg1,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: colors.text,
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
        backgroundColor: colors.accent,
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
        color: colors.textMuted,
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
        color: colors.text,
        fontSize: 15,
        fontWeight: '500',
    },
    toggleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        color: colors.accent,
        fontSize: 13,
    },
    langSelect: {
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    langText: {
        color: colors.text,
        fontSize: 13,
    },
    prefDivider: {
        height: 1,
        backgroundColor: colors.cardBorder,
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
        color: colors.danger,
        fontWeight: '700',
    },
    modalText: {
        color: colors.textMuted,
        fontSize: 13,
    },
    avatarOptions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    avatarOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
    },
});

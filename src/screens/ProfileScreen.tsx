import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Share, Alert, Clipboard, Platform } from 'react-native';
import { Text, Avatar, TextInput, Button, SegmentedButtons, Switch, Surface, Portal, Modal, Divider, List, Card, IconButton } from 'react-native-paper';
import { useClerk } from '@clerk/clerk-expo';
import { useHabits } from '../hooks/useHabits';
import { tw } from '../utils/theme';

interface ProfileScreenProps {
  onSignOut: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onSignOut }) => {
  const { signOut } = useClerk();
  const { settings, updateSettings, backup, restore } = useHabits();

  // State controls
  const [userNameEdit, setUserNameEdit] = useState(settings.userName);
  const [isEditingName, setIsEditingName] = useState(false);
  
  const [notifHour, setNotifHour] = useState(settings.notificationTime.split(':')[0] || '09');
  const [notifMinute, setNotifMinute] = useState(settings.notificationTime.split(':')[1] || '00');
  const [notifMessage, setNotifMessage] = useState(settings.notificationMessage);

  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [backupText, setBackupText] = useState('');
  const [restoring, setRestoring] = useState(false);

  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Update name helper
  const handleSaveName = async () => {
    const trimmed = userNameEdit.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    await updateSettings({ userName: trimmed });
    setIsEditingName(false);
  };

  // Update notification settings helper
  const handleSaveNotifications = async (enabled: boolean) => {
    const h = parseInt(notifHour, 10);
    const m = parseInt(notifMinute, 10);
    
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      Alert.alert('Error', 'Please enter a valid time (HH:MM)');
      return;
    }

    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    await updateSettings({
      notificationsEnabled: enabled,
      notificationTime: timeStr,
      notificationMessage: notifMessage.trim(),
    });
  };

  // Backup exporter using native share sheets
  const handleBackup = async () => {
    try {
      const dataStr = await backup();
      
      // Open native OS sharing window
      const result = await Share.share({
        message: dataStr,
        title: 'HabitFlow Local Backup Data',
      });
      
      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Backup data shared successfully. Save it in a safe place!');
      }
    } catch (error: any) {
      Alert.alert('Backup Error', error.message || 'Failed to generate backup file.');
    }
  };

  // Restore importer
  const handleRestore = async () => {
    const trimmedBackup = backupText.trim();
    if (!trimmedBackup) {
      Alert.alert('Error', 'Please paste the backup code');
      return;
    }

    setRestoring(true);
    try {
      const res = await restore(trimmedBackup);
      setRestoring(false);
      
      if (res.success) {
        setRestoreModalVisible(false);
        setBackupText('');
        Alert.alert('Success', 'Database restored successfully!');
      } else {
        Alert.alert('Restore Failed', res.error || 'The backup data format is invalid.');
      }
    } catch (err) {
      setRestoring(false);
      Alert.alert('Error', 'Invalid JSON backup string format');
    }
  };

  const handleSignOutPress = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              console.warn('Error signing out with Clerk:', e);
            }
            onSignOut();
          } 
        }
      ]
    );
  };

  return (
    <View style={tw`flex-1 bg-iosBgLight dark:bg-iosBgDark`}>
      <ScrollView contentContainerStyle={tw`px-5 pt-8 pb-10`}>
        {/* User Card Header */}
        <Surface style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 items-center shadow-sm`}>
          <Avatar.Text 
            size={70} 
            label={settings.userName.slice(0, 2).toUpperCase()} 
            style={tw`bg-indigo`}
            color="#FFFFFF"
          />
          
          {isEditingName ? (
            <View style={tw`flex-row items-center mt-4 w-full px-4`}>
              <TextInput
                value={userNameEdit}
                onChangeText={setUserNameEdit}
                maxLength={20}
                style={tw`flex-grow mr-2 h-10 bg-transparent`}
                mode="outlined"
                activeOutlineColor={tw.color('indigo')}
                textColor={tw.color('iosTextLight')}
              />
              <Button mode="contained" onPress={handleSaveName} style={tw`bg-indigo`}>
                Save
              </Button>
            </View>
          ) : (
            <View style={tw`flex-row items-center mt-4`}>
              <Text style={tw`text-xl font-black text-iosTextLight dark:text-iosTextDark`}>
                {settings.userName}
              </Text>
              <IconButton 
                icon="pencil" 
                size={16} 
                iconColor={tw.color('iosSubtextLight')}
                onPress={() => {
                  setUserNameEdit(settings.userName);
                  setIsEditingName(true);
                }} 
              />
            </View>
          )}

          <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mt-1`}>
            Account ID: {settings.userId}
          </Text>
        </Surface>

        {/* Theme Settings Section */}
        <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2.5 uppercase tracking-wider`}>
          Interface Settings
        </Text>
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <Text style={tw`text-sm font-bold text-iosTextLight dark:text-iosTextDark mb-3`}>
            Color Theme
          </Text>
          <SegmentedButtons
            value={settings.theme}
            onValueChange={(val: any) => updateSettings({ theme: val })}
            buttons={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            theme={{
              colors: {
                secondaryContainer: tw.color('indigo/15') || '#E5E5EA',
                onSecondaryContainer: tw.color('indigo'),
              }
            }}
          />
        </Card>

        {/* Notification Settings Section */}
        <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2.5 uppercase tracking-wider`}>
          Reminder Settings
        </Text>
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <View>
              <Text style={tw`text-sm font-bold text-iosTextLight dark:text-iosTextDark`}>Daily Notifications</Text>
              <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark`}>Alert you before habits miss</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleSaveNotifications}
              color={tw.color('indigo')}
            />
          </View>

          {settings.notificationsEnabled && (
            <View style={tw`mt-2 pt-3 border-t border-iosBorderLight dark:border-iosBorderDark`}>
              <Text style={tw`text-xs font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2`}>REMINDER TIME</Text>
              <View style={tw`flex-row items-center mb-4`}>
                <TextInput
                  value={notifHour}
                  onChangeText={(val) => setNotifHour(val.replace(/[^0-9]/g, '').slice(0, 2))}
                  maxLength={2}
                  keyboardType="number-pad"
                  style={tw`w-14 text-center h-10 bg-transparent`}
                  placeholder="HH"
                  textColor={tw.color('iosTextLight')}
                />
                <Text style={tw`mx-2 text-lg font-bold text-iosTextLight dark:text-iosTextDark`}>:</Text>
                <TextInput
                  value={notifMinute}
                  onChangeText={(val) => setNotifMinute(val.replace(/[^0-9]/g, '').slice(0, 2))}
                  maxLength={2}
                  keyboardType="number-pad"
                  style={tw`w-14 text-center h-10 bg-transparent`}
                  placeholder="MM"
                  textColor={tw.color('iosTextLight')}
                />
                <Button 
                  mode="text" 
                  onPress={() => handleSaveNotifications(true)}
                  textColor={tw.color('indigo')}
                  style={tw`ml-auto`}
                >
                  Save Time
                </Button>
              </View>

              <Text style={tw`text-xs font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2`}>CUSTOM ALERT MESSAGE</Text>
              <TextInput
                value={notifMessage}
                onChangeText={setNotifMessage}
                maxLength={100}
                mode="outlined"
                outlineColor={tw.color('iosBorderLight')}
                activeOutlineColor={tw.color('indigo')}
                style={tw`bg-transparent text-sm mb-2`}
                textColor={tw.color('iosTextLight')}
              />
              <Button 
                mode="contained-tonal"
                onPress={() => handleSaveNotifications(true)}
                style={tw`bg-indigo/10 rounded-xl mt-1`}
                textColor={tw.color('indigo')}
              >
                Save Alert Message
              </Button>
            </View>
          )}
        </Card>

        {/* Data Persistence Section */}
        <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2.5 uppercase tracking-wider`}>
          Data Management
        </Text>
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark leading-relaxed mb-4`}>
            Your habits data is stored locally. Generate backup codes to transfer data, or restore previously saved copies.
          </Text>
          <View style={tw`flex-row justify-between`}>
            <Button
              mode="contained-tonal"
              icon="upload"
              onPress={handleBackup}
              style={tw`flex-1 mr-2 rounded-xl bg-indigo/10`}
              textColor={tw.color('indigo')}
            >
              Backup
            </Button>
            <Button
              mode="contained-tonal"
              icon="download"
              onPress={() => setRestoreModalVisible(true)}
              style={tw`flex-1 ml-2 rounded-xl bg-indigo/10`}
              textColor={tw.color('indigo')}
            >
              Restore
            </Button>
          </View>
        </Card>

        {/* Informative List Section */}
        <Card style={tw`rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark shadow-sm mb-6 overflow-hidden`}>
          <List.Item
            title="About HabitFlow"
            left={props => <List.Icon {...props} icon="information-outline" />}
            onPress={() => setAboutModalVisible(true)}
            titleStyle={tw`text-iosTextLight dark:text-iosTextDark`}
          />
          <Divider style={tw`bg-iosBorderLight dark:bg-iosBorderDark`} />
          <List.Item
            title="Privacy Policy & Terms"
            left={props => <List.Icon {...props} icon="shield-check-outline" />}
            onPress={() => setPrivacyModalVisible(true)}
            titleStyle={tw`text-iosTextLight dark:text-iosTextDark`}
          />
        </Card>

        {/* Sign Out Button */}
        <Button
          mode="contained"
          icon="logout"
          onPress={handleSignOutPress}
          style={tw`bg-coral rounded-xl mb-12`}
        >
          Sign Out
        </Button>
      </ScrollView>

      {/* Restore Data Code Input Modal */}
      <Portal>
        <Modal
          visible={restoreModalVisible}
          onDismiss={() => setRestoreModalVisible(false)}
          contentContainerStyle={tw`bg-iosBgLight dark:bg-iosBgDark m-5 p-6 rounded-3xl border border-iosBorderLight dark:border-iosBorderDark`}
        >
          <Text style={tw`text-xl font-black text-iosTextLight dark:text-iosTextDark mb-2`}>
            Restore Backup
          </Text>
          <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mb-4 leading-relaxed`}>
            Warning: Restoring data will overwrite all active habits and history. Paste the backup JSON string block below.
          </Text>

          <TextInput
            placeholder="Paste backup JSON string here..."
            value={backupText}
            onChangeText={setBackupText}
            multiline
            numberOfLines={6}
            mode="outlined"
            outlineColor={tw.color('iosBorderLight')}
            activeOutlineColor={tw.color('indigo')}
            style={tw`bg-transparent text-sm mb-6 max-h-40`}
            textColor={tw.color('iosTextLight')}
          />

          <View style={tw`flex-row justify-end`}>
            <Button
              mode="text"
              onPress={() => setRestoreModalVisible(false)}
              textColor={tw.color('iosSubtextLight')}
              style={tw`mr-2`}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleRestore}
              disabled={restoring}
              style={tw`bg-indigo rounded-xl`}
            >
              Verify & Import
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* About Modal */}
      <Portal>
        <Modal
          visible={aboutModalVisible}
          onDismiss={() => setAboutModalVisible(false)}
          contentContainerStyle={tw`bg-iosBgLight dark:bg-iosBgDark m-5 p-6 rounded-3xl border border-iosBorderLight dark:border-iosBorderDark`}
        >
          <Text style={tw`text-xl font-black text-iosTextLight dark:text-iosTextDark mb-2`}>
            About HabitFlow
          </Text>
          <Text style={tw`text-sm text-iosTextLight dark:text-iosTextDark leading-relaxed mb-4`}>
            HabitFlow V1.0.0 is a premium Daily Habit & Streak Tracker engineered for consistency, focus, and mindful living.
          </Text>
          <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark leading-relaxed mb-4`}>
            Built with React Native, Expo, SQLite, and Clerk. Inspired by minimalist interfaces that promote clean habits without noise or ads.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => setAboutModalVisible(false)}
            style={tw`bg-indigo rounded-xl`}
          >
            Done
          </Button>
        </Modal>
      </Portal>

      {/* Privacy Policy and Terms Modal */}
      <Portal>
        <Modal
          visible={privacyModalVisible}
          onDismiss={() => setPrivacyModalVisible(false)}
          contentContainerStyle={tw`bg-iosBgLight dark:bg-iosBgDark m-5 p-6 rounded-3xl border border-iosBorderLight dark:border-iosBorderDark`}
        >
          <Text style={tw`text-xl font-black text-iosTextLight dark:text-iosTextDark mb-2`}>
            Privacy & Terms
          </Text>
          <ScrollView style={tw`max-h-60 mb-4`}>
            <Text style={tw`text-xs font-bold text-iosTextLight dark:text-iosTextDark mb-1`}>1. Data Isolation</Text>
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark leading-relaxed mb-3`}>
              All habits, history logs, settings preferences, and records are stored inside a local sandbox SQL database on your physical device. No analytics or tracker logs are transmitted to any cloud servers in V1.
            </Text>
            <Text style={tw`text-xs font-bold text-iosTextLight dark:text-iosTextDark mb-1`}>2. Token Safety</Text>
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark leading-relaxed mb-3`}>
              Authentication keys and session states are securely locked using the device's native keychain services (SecureStore).
            </Text>
            <Text style={tw`text-xs font-bold text-iosTextLight dark:text-iosTextDark mb-1`}>3. User Agreement</Text>
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark leading-relaxed`}>
              By using this application, you agree to keep your backup JSON codes secure to preserve your records in case of device replacement or app uninstall.
            </Text>
          </ScrollView>
          <Button 
            mode="contained" 
            onPress={() => setPrivacyModalVisible(false)}
            style={tw`bg-indigo rounded-xl`}
          >
            I Accept
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

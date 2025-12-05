import { View, Text, StyleSheet, Pressable, Alert, Platform, Image, Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Globe, Bell, FileText, Shield, Mail, ExternalLink, Book, ArrowLeft } from 'lucide-react-native';
import { usePrayer } from '../../contexts/PrayerContext';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, prayers, updateProfile } = usePrayer();

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photos to upload a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as ImagePicker.MediaTypeOptions,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateProfile({ profileImageUri: result.assets[0].uri });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleOpenNotifications = () => {
    router.push('/notifications');
  };

  const handleOpenLink = async (url: string, title: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${title}`);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', `Failed to open ${title}`);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral.cream, colors.primary.lavender]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topHeader}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={() => {
                console.log('[ProfileScreen] Back button pressed');
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/pray');
              }}
            >
              <ArrowLeft size={24} color={colors.primary.mauve} />
            </Pressable>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.avatar,
                pressed && styles.avatarPressed,
              ]}
              onPress={handlePickImage}
            >
              {profile.profileImageUri ? (
                <Image
                  source={{ uri: profile.profileImageUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <User size={48} color={colors.primary.mauve} />
              )}
            </Pressable>
            {profile.name && profile.name.trim() !== '' && (
              <Text style={styles.name}>{profile.name}</Text>
            )}
            <Text style={styles.subtitle}>Blessed and loved</Text>
          </View>

          <View style={styles.stats}>
            <Pressable
              style={({ pressed }) => [
                styles.statCard,
                pressed && styles.statCardPressed,
              ]}
              onPress={() => {
                console.log('[ProfileScreen] Prayers stat pressed, navigating to prayers tab');
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/prayers');
              }}
            >
              <Text style={styles.statNumber}>{prayers.length}</Text>
              <Text style={styles.statLabel}>Prayers</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.statCard,
                pressed && styles.statCardPressed,
              ]}
              onPress={() => {
                console.log('[ProfileScreen] Shared Prayers stat pressed, navigating to prayers tab');
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/prayers');
              }}
            >
              <Text style={styles.statNumber}>{prayers.filter((p) => p.isFavorite).length}</Text>
              <Text style={styles.statLabel}>Shared Prayers</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingsList}>
              <Pressable
                style={({ pressed }) => [
                  styles.settingItem,
                  pressed && styles.settingItemPressed,
                ]}
              >
                <View style={styles.settingIcon}>
                  <Globe size={20} color={colors.primary.mauve} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingValue}>
                    {profile.preferredLanguage === 'en' ? 'English' : 'Español'}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.settingItem,
                  pressed && styles.settingItemPressed,
                ]}
                onPress={handleOpenNotifications}
              >
                <View style={styles.settingIcon}>
                  <Bell size={20} color={colors.primary.mauve} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingValue}>
                    {profile.notificationSettings?.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal & Support</Text>
            <View style={styles.settingsList}>
              <Pressable
                style={({ pressed }) => [
                  styles.settingItem,
                  pressed && styles.settingItemPressed,
                ]}
                onPress={() => handleOpenLink('https://womengonebible.com/privacy-policy', 'Privacy Policy')}
              >
                <View style={styles.settingIcon}>
                  <Shield size={20} color={colors.primary.mauve} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                </View>
                <ExternalLink size={16} color={colors.functional.textSecondary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.settingItem,
                  pressed && styles.settingItemPressed,
                ]}
                onPress={() => handleOpenLink('https://womengonebible.com/terms--conditions', 'Terms of Service')}
              >
                <View style={styles.settingIcon}>
                  <FileText size={20} color={colors.primary.mauve} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Terms of Service</Text>
                </View>
                <ExternalLink size={16} color={colors.functional.textSecondary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.settingItem,
                  pressed && styles.settingItemPressed,
                ]}
                onPress={() => handleOpenLink('https://womengonebible.com/', 'About Us')}
              >
                <View style={styles.settingIcon}>
                  <Book size={20} color={colors.primary.mauve} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>About Us</Text>
                </View>
                <ExternalLink size={16} color={colors.functional.textSecondary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.settingItem,
                  pressed && styles.settingItemPressed,
                ]}
                onPress={() => handleOpenLink('mailto:hello@gonebible.com', 'Support')}
              >
                <View style={styles.settingIcon}>
                  <Mail size={20} color={colors.primary.mauve} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Contact Support</Text>
                  <Text style={styles.settingValue}>hello@gonebible.com</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <Text style={styles.version}>Women Gone Bible Prayer App v1.0.0</Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
  },
  headerSpacer: {
    width: 40,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  avatarPressed: {
    opacity: 0.7,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: colors.primary.lilac,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  statNumber: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.primary.mauve,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.functional.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    marginLeft: spacing.xs,
  },
  settingsList: {
    gap: spacing.sm,
  },
  settingItem: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: colors.primary.lilac,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItemPressed: {
    opacity: 0.7,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  settingValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
  },
  version: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

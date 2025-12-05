import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { usePrayer } from '../contexts/PrayerContext';
import { colors, typography, spacing, borderRadius } from '../constants/colors';
import type { NotificationSettings } from '../types/prayer';

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const TIMES = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = usePrayer();

  const currentSettings: NotificationSettings = profile.notificationSettings || {
    enabled: false,
    days: [0, 1, 2, 3, 4, 5, 6],
    time: '09:00',
  };

  const [enabled, setEnabled] = useState(currentSettings.enabled);
  const [selectedDays, setSelectedDays] = useState<number[]>(currentSettings.days);
  const [selectedTime, setSelectedTime] = useState(currentSettings.time);

  const handleToggleEnabled = (value: boolean) => {
    setEnabled(value);
    updateProfile({
      notificationSettings: {
        enabled: value,
        days: selectedDays,
        time: selectedTime,
      },
    });
  };

  const handleToggleDay = (dayId: number) => {
    const newDays = selectedDays.includes(dayId)
      ? selectedDays.filter((d) => d !== dayId)
      : [...selectedDays, dayId].sort();
    
    setSelectedDays(newDays);
    updateProfile({
      notificationSettings: {
        enabled,
        days: newDays,
        time: selectedTime,
      },
    });
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    updateProfile({
      notificationSettings: {
        enabled,
        days: selectedDays,
        time,
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral.cream, colors.primary.lavender]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={colors.functional.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Prayer Reminders</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>Enable Reminders</Text>
                <Text style={styles.sectionDescription}>
                  Get daily reminders to pause and pray
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggleEnabled}
                trackColor={{
                  false: colors.neutral.softGray,
                  true: colors.primary.mauve,
                }}
                thumbColor={colors.neutral.white}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Days</Text>
            <View style={styles.daysGrid}>
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <Pressable
                    key={day.id}
                    style={({ pressed }) => [
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                      pressed && styles.dayButtonPressed,
                    ]}
                    onPress={() => handleToggleDay(day.id)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        isSelected && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Clock size={20} color={colors.primary.mauve} />
              <Text style={styles.sectionTitle}>Choose Time</Text>
            </View>
            <View style={styles.timeGrid}>
              {TIMES.map((time) => {
                const isSelected = selectedTime === time.value;
                return (
                  <Pressable
                    key={time.value}
                    style={({ pressed }) => [
                      styles.timeButton,
                      isSelected && styles.timeButtonSelected,
                      pressed && styles.timeButtonPressed,
                    ]}
                    onPress={() => handleSelectTime(time.value)}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        isSelected && styles.timeButtonTextSelected,
                      ]}
                    >
                      {time.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {"You'll receive a gentle reminder at your selected time on the days you choose. Take a moment to pray, reflect, and connect with God."}
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.primary.lilac,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionInfo: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: colors.primary.lavender,
    borderColor: colors.primary.mauve,
  },
  dayButtonPressed: {
    opacity: 0.7,
  },
  dayButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.functional.textSecondary,
  },
  dayButtonTextSelected: {
    color: colors.primary.mauve,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.lightGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeButtonSelected: {
    backgroundColor: colors.primary.lavender,
    borderColor: colors.primary.mauve,
  },
  timeButtonPressed: {
    opacity: 0.7,
  },
  timeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.functional.textSecondary,
  },
  timeButtonTextSelected: {
    color: colors.primary.mauve,
  },
  infoCard: {
    backgroundColor: colors.primary.lavender,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    textAlign: 'center',
  },
});

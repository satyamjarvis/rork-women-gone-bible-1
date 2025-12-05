import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import type { PrayerType, Language } from '../../types/prayer';

export default function PrayerLanguageScreen() {
  const router = useRouter();
  const { type, name } = useLocalSearchParams<{ type: PrayerType; name: string }>();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<Language>('en');

  const handleContinue = () => {
    router.push({
      pathname: '/prayer/input',
      params: { type, name, language },
    });
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.primary.lavender }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: Platform.OS === 'web' ? insets.top + spacing.md : spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary.purple} strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.topSection}>
          <Text style={styles.badge}>Guided Prayer</Text>
          
          <Text style={styles.title}>
            Which language feels most{"\n"}
            like home?
          </Text>
          <Text style={styles.subtitle}>
            Choose the language that lets your heart relax. You can switch later in settings.
          </Text>
        </View>

        <View style={styles.options}>
          <Pressable
            style={({ pressed }) => [
              styles.languageCard,
              language === 'en' && styles.languageCardActive,
              pressed && styles.languageCardPressed,
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.languageTitle, language === 'en' && styles.languageTitleActive]}>
              English
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.languageCard,
              language === 'es' && styles.languageCardActive,
              pressed && styles.languageCardPressed,
            ]}
            onPress={() => setLanguage('es')}
          >
            <Text style={[styles.languageTitle, language === 'es' && styles.languageTitleActive]}>
              Español
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.primary.purple,
  },
  topSection: {
    gap: spacing.lg,
  },
  badge: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary.purple,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  languageCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.functional.border,
  },
  languageCardActive: {
    backgroundColor: colors.primary.purple,
    borderColor: colors.primary.purple,
  },
  languageCardPressed: {
    opacity: 0.8,
  },
  languageTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  languageTitleActive: {
    color: colors.neutral.white,
  },
  button: {
    backgroundColor: colors.primary.purple,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md + spacing.xs,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
  },
});

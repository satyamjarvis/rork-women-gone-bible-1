import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import type { PrayerType, Language } from '../../types/prayer';
import * as Haptics from 'expo-haptics';
import { usePrayer } from '../../contexts/PrayerContext';

export default function PrayerNameScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: PrayerType }>();
  const insets = useSafeAreaInsets();
  const { updateProfile, profile } = usePrayer();
  const [name, setName] = useState(type === 'myself' && profile.name ? profile.name : '');
  const [language, setLanguage] = useState<Language>('en');
  const buttonScale = useRef(new Animated.Value(1)).current;

  const isSelf = type === 'myself';
  const title = isSelf 
    ? 'What name feels most true for you here?'
    : 'What is her name?';
  const subtitle = isSelf
    ? "You can write your first name, a nickname, or simply 'me'. This is between you and God."
    : "If you only know her first name, that is more than enough. God already knows every detail.";
  const placeholder = isSelf ? 'Sarah' : 'Her name';

  const handleContinue = () => {
    if (name.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      if (type === 'myself') {
        console.log('[PrayerName] Saving name to profile:', name.trim());
        updateProfile({ name: name.trim() });
      }
      
      router.push({
        pathname: '/prayer/input',
        params: { type, name, language },
      });
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setLanguage(lang);
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.neutral.cream }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? insets.top + spacing.md : spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.primary.teal} strokeWidth={2.5} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.topSection}>
            <Text style={styles.badge}>Guided Prayer</Text>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={placeholder}
              placeholderTextColor={colors.functional.textSecondary}
              autoCapitalize="words"
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              editable={true}
            />
            


            <View style={styles.languageSection}>
              <Text style={styles.languageLabel}>Language</Text>
              <View style={styles.languageOptions}>
                <Pressable
                  style={[
                    styles.languageCard,
                    language === 'en' && styles.languageCardActive,
                  ]}
                  onPress={() => handleLanguageSelect('en')}
                >
                  <Text style={[styles.languageTitle, language === 'en' && styles.languageTitleActive]}>
                    English
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.languageCard,
                    language === 'es' && styles.languageCardActive,
                  ]}
                  onPress={() => handleLanguageSelect('es')}
                >
                  <Text style={[styles.languageTitle, language === 'es' && styles.languageTitleActive]}>
                    Español
                  </Text>
                </Pressable>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Pressable
                style={[
                  styles.button,
                  !name.trim() && styles.buttonDisabled,
                ]}
                onPress={handleContinue}
                onPressIn={name.trim() ? handlePressIn : undefined}
                onPressOut={name.trim() ? handlePressOut : undefined}
                disabled={!name.trim()}
              >
                <Text style={[styles.buttonText, !name.trim() && styles.buttonTextDisabled]}>Continue</Text>
              </Pressable>
            </Animated.View>
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
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
    color: colors.primary.teal,
  },
  topSection: {
    gap: spacing.lg,
  },
  badge: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary.teal,
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
  form: {
    flex: 1,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
    borderWidth: 1,
    borderColor: colors.functional.border,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      cursor: 'text',
    }),
  },
  helpText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md + spacing.xs,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonDisabled: {
    backgroundColor: colors.neutral.softGray,
  },

  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
  },
  buttonTextDisabled: {
    color: colors.functional.textSecondary,
  },
  languageSection: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  languageLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  languageCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm + spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.functional.border,
  },
  languageCardActive: {
    backgroundColor: colors.primary.teal,
    borderColor: colors.primary.teal,
  },

  languageTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  languageTitleActive: {
    color: colors.neutral.white,
  },
});

import { View, Text, StyleSheet, Pressable, TextInput, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { usePrayer } from '../contexts/PrayerContext';
import { useState, useRef } from 'react';
import { colors, typography, spacing, borderRadius } from '../constants/colors';
import type { Language } from '../types/prayer';
import * as Haptics from 'expo-haptics';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = usePrayer();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleContinue = () => {
    if (name.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      completeOnboarding(name, language);
      router.replace('/(tabs)/pray');
    }
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

  const handleLanguageSelect = (lang: Language) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral.cream, colors.primary.lightTeal]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Let&apos;s make this personal</Text>
            <Text style={styles.subtitle}>
              What should we call you? This is your sacred space, and we want every prayer to feel like it was written just for you.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.functional.textSecondary}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="done"
              />
            </View>

            <View style={styles.languageContainer}>
              <Text style={styles.label}>Preferred Language</Text>
              <View style={styles.languageButtons}>
                <Pressable
                  style={[
                    styles.languageButton,
                    language === 'en' && styles.languageButtonActive,
                  ]}
                  onPress={() => handleLanguageSelect('en')}
                >
                  <Text
                    style={[
                      styles.languageText,
                      language === 'en' && styles.languageTextActive,
                    ]}
                  >
                    English
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.languageButton,
                    language === 'es' && styles.languageButtonActive,
                  ]}
                  onPress={() => handleLanguageSelect('es')}
                >
                  <Text
                    style={[
                      styles.languageText,
                      language === 'es' && styles.languageTextActive,
                    ]}
                  >
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
                <LinearGradient
                  colors={
                    name.trim()
                      ? [colors.primary.teal, colors.primary.purple]
                      : [colors.neutral.softGray, colors.neutral.softGray]
                  }
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          <Text style={styles.disclaimer}>
            Your information is private and stored securely on your device
          </Text>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    textAlign: 'center',
  },
  form: {
    gap: spacing.xl,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + spacing.xs,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
    borderWidth: 2,
    borderColor: colors.functional.border,
  },
  languageContainer: {
    gap: spacing.sm,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  languageButton: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.functional.border,
  },
  languageButtonActive: {
    borderColor: colors.primary.teal,
    backgroundColor: colors.primary.lightTeal,
  },

  languageText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.functional.textSecondary,
  },
  languageTextActive: {
    color: colors.primary.teal,
    fontWeight: typography.weights.semibold,
  },
  button: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
  },
  disclaimer: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
  },
});

import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { usePrayer } from '../contexts/PrayerContext';
import { useEffect } from 'react';
import { colors, typography, spacing } from '../constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = usePrayer();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (profile.hasCompletedOnboarding) {
      router.replace('/(tabs)/pray');
    }
  }, [profile.hasCompletedOnboarding, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary.lavender, colors.primary.softPink]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qkq6acho8z7uxaxl9xhuj' }}
              style={styles.wordLogo}
              resizeMode="contain"
            />
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/clo6utebx4gywicf0cy0c' }}
              style={styles.iconLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.title}>
              You Are{"\n"}Never Alone
            </Text>
            <Text style={styles.tagline}>Your Personal Prayer Helper</Text>
            <Text style={styles.subtitle}>
              When your heart is exhausted{"\n"}share your burdens and{"\n"}find peace in God&apos;s word.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/prayer/type')}
            >
              <LinearGradient
                colors={[colors.primary.teal, colors.primary.purple]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Begin a guided prayer</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.disclaimer}>
              A safe space for women to connect{"\n"}with God through prayer
            </Text>
          </View>
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
    justifyContent: 'space-evenly',
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  wordLogo: {
    width: 280,
    height: 70,
  },
  iconLogo: {
    width: 120,
    height: 120,
  },
  messageContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    textAlign: 'center',
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.primary.purple,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.sm,
  },
  buttonContainer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.8,
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
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
});

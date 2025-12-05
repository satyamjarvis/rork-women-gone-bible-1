import { View, Text, StyleSheet, Pressable, Platform, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import { usePrayer } from '../../contexts/PrayerContext';
import { useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';

export default function PrayerTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = usePrayer();
  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;

  const handleSelection = (type: 'myself' | 'send') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    console.log('[PrayerType] Selection:', { type, profileName: profile.name, hasName: !!profile.name });
    
    if (type === 'myself' && profile.name && profile.name.trim() !== '') {
      console.log('[PrayerType] User has name, skipping name screen');
      router.push({
        pathname: '/prayer/language',
        params: { type, name: profile.name },
      });
    } else {
      console.log('[PrayerType] Going to name screen');
      router.push({
        pathname: '/prayer/name',
        params: { type },
      });
    }
  };

  const createPressHandlers = (scaleRef: Animated.Value) => ({
    onPressIn: () => {
      Animated.spring(scaleRef, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(scaleRef, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.primary.softPink }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <ArrowLeft size={24} color={colors.primary.darkPurple} />
        </TouchableOpacity>
      </View>
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.topSection}>
          <Text style={styles.badge}>Guided Prayer</Text>
          
          <Text style={styles.title}>What&rsquo;s pressing on your heart today?</Text>
          <Text style={styles.subtitle}>
            Take a breath. God sees you, and He cares about every detail.
          </Text>
        </View>

        <View style={styles.options}>
          <Animated.View style={{ transform: [{ scale: card1Scale }] }}>
            <Pressable
              style={styles.optionCard}
              onPress={() => handleSelection('myself')}
              {...createPressHandlers(card1Scale)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>My own heart</Text>
                <Text style={styles.optionDescription}>
                  When you&rsquo;re carrying fear, stress, confusion, or quiet hurts you haven&rsquo;t spoken out loud.
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: card2Scale }] }}>
            <Pressable
              style={styles.optionCard}
              onPress={() => handleSelection('send')}
              {...createPressHandlers(card2Scale)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Someone I love</Text>
                <Text style={styles.optionDescription}>
                  When a sister, daughter, friend, or loved one is on your heart – and you want to send them a prayer filled with hope.
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>

        <Text style={styles.disclaimer}>
          Your words matter here. God meets{"\n"}you right where you are.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: Platform.OS === 'web' ? 'space-between' : 'flex-start',
    gap: spacing.md,
  },
  topSection: {
    gap: Platform.OS === 'web' ? spacing.lg : spacing.md,
    alignItems: 'center' as const,
    marginBottom: Platform.OS === 'web' ? 0 : spacing.md,
  },
  badge: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    textAlign: 'center' as const,
  },
  options: {
    gap: spacing.md,
    marginBottom: Platform.OS === 'web' ? 0 : spacing.md,
  },
  optionCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  optionContent: {
    gap: spacing.sm,
  },
  optionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary.darkPurple,
  },
  optionDescription: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  disclaimer: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center' as const,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.sm,
    marginBottom: Platform.OS === 'web' ? spacing.sm : 0,
    marginTop: Platform.OS === 'web' ? 0 : spacing.xs,
  },
});

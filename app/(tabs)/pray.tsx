import { View, Text, StyleSheet, Pressable, Image, ScrollView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import * as Haptics from 'expo-haptics';
import { useSubscription } from '../../contexts/SubscriptionContext';
import UpgradeModal from '../../components/UpgradeModal';
import { usePrayer } from '../../contexts/PrayerContext';

export default function PrayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = usePrayer();
  const [imageError, setImageError] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const { canUsePrayerGeneration, upgradeToPremium } = useSubscription();

  const handleNewPrayer = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (!canUsePrayerGeneration) {
      console.log('[PrayScreen] Prayer generation limit reached, showing upgrade modal');
      setShowUpgradeModal(true);
      return;
    }
    
    router.push('/prayer/type');
  };

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral.cream, colors.primary.lightBlue]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + (Platform.OS === 'web' ? spacing.xl : spacing.md), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 150 : spacing.xxl) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.brandContainer}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ra33djn4oemr3vp1b363t' }}
                style={styles.womenGoneBibleLogo}
                resizeMode="contain"
              />
              {!imageError ? (
                <Image 
                  source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/siq1n0vuktpemwulj11ra' }}
                  style={styles.iconLogo}
                  resizeMode="contain"
                  onError={() => {
                    console.log('[PrayScreen] Icon logo failed to load');
                    setImageError(true);
                  }}
                />
              ) : null}
            </View>

            <View style={styles.messageContainer}>
              <Text style={styles.title}>What is weighing on your heart today?</Text>
              <Text style={styles.subtitle}>
                Open your heart to God with complete honesty. Share what hurts, what feels heavy, or what feels impossible to navigate alone for yourself or someone you love.
              </Text>
            </View>

            <Animated.View
              style={[
                { transform: [{ scale: buttonScale }], opacity: buttonOpacity },
              ]}
            >
              <Pressable
                style={styles.button}
                onPress={handleNewPrayer}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <LinearGradient
                  colors={[colors.primary.softBlue, colors.primary.dustyBlue]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Plus size={24} color={colors.neutral.white} />
                  <Text style={styles.buttonText}>Start a New Prayer</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </LinearGradient>
      
      <UpgradeModal
        visible={showUpgradeModal}
        onDismiss={() => setShowUpgradeModal(false)}
        onUpgrade={(tier) => {
          upgradeToPremium(tier);
          setShowUpgradeModal(false);
        }}
        language={profile.preferredLanguage}
      />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
    alignItems: 'center',
    gap: Platform.OS === 'web' ? spacing.xl * 2 : spacing.lg,
    minHeight: '100%',
    paddingTop: Platform.OS === 'web' ? 0 : spacing.md,
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  womenGoneBibleLogo: {
    width: Platform.OS === 'web' ? 180 : 160,
    height: Platform.OS === 'web' ? 60 : 53,
  },
  iconLogo: {
    width: Platform.OS === 'web' ? 160 : 130,
    height: Platform.OS === 'web' ? 160 : 130,
  },
  messageContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    maxWidth: 500,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    textAlign: 'center',
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.6,
  },
  button: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: colors.primary.softBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 400,
    minWidth: 280,
    alignSelf: 'center',
  },

  buttonGradient: {
    paddingVertical: spacing.lg + spacing.xs,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 56,
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
    letterSpacing: 0.3,
  },
});

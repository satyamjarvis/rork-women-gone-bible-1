import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Animated } from 'react-native';
import { X, Crown, Check } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../constants/colors';
import { useRef, useEffect } from 'react';

interface UpgradeModalProps {
  visible: boolean;
  onDismiss: () => void;
  onUpgrade: (tier: 'monthly' | 'annual') => void;
  language: 'en' | 'es';
}

export default function UpgradeModal({ visible, onDismiss, onUpgrade, language }: UpgradeModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 14,
          bounciness: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const features = [
    {
      en: 'Unlimited prayer generation',
      es: 'Generación ilimitada de oraciones',
    },
    {
      en: 'Unlimited prayer card downloads',
      es: 'Descargas ilimitadas de tarjetas de oración',
    },
    {
      en: 'Unlimited prayer sharing',
      es: 'Compartir oraciones ilimitado',
    },
    {
      en: 'Support the Women Gone Bible community',
      es: 'Apoya la comunidad de Women Gone Bible',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Crown size={32} color={colors.primary.purple} fill={colors.primary.purple} />
                <Pressable onPress={onDismiss} style={styles.closeButton}>
                  <X size={24} color={colors.functional.text} />
                </Pressable>
              </View>

              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  {language === 'en' 
                    ? "You've Reached Today's Free Limit" 
                    : 'Has Alcanzado el Límite Gratuito de Hoy'}
                </Text>
                <Text style={styles.subtitle}>
                  {language === 'en'
                    ? 'Upgrade to Women Gone Bible Unlimited for unlimited prayer help, prayer card downloads, and sending prayers to others.'
                    : 'Actualiza a Women Gone Bible Unlimited para ayuda de oración ilimitada, descargas de tarjetas de oración y envío de oraciones a otros.'}
                </Text>
              </View>

              <View style={styles.featuresContainer}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={20} color={colors.functional.success} strokeWidth={3} />
                    <Text style={styles.featureText}>
                      {language === 'en' ? feature.en : feature.es}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.plansContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.planCard,
                    styles.planCardAnnual,
                    pressed && styles.planCardPressed,
                  ]}
                  onPress={() => onUpgrade('annual')}
                >
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>
                      {language === 'en' ? 'SAVE 30%' : 'AHORRA 30%'}
                    </Text>
                  </View>
                  <Text style={styles.planName}>
                    {language === 'en' ? 'Annual' : 'Anual'}
                  </Text>
                  <Text style={styles.planPrice}>$39.99</Text>
                  <Text style={styles.planPeriod}>
                    {language === 'en' ? 'per year' : 'por año'}
                  </Text>
                  <Text style={styles.planSavings}>
                    {language === 'en' ? '$3.33/month' : '$3.33/mes'}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.planCard,
                    pressed && styles.planCardPressed,
                  ]}
                  onPress={() => onUpgrade('monthly')}
                >
                  <Text style={styles.planName}>
                    {language === 'en' ? 'Monthly' : 'Mensual'}
                  </Text>
                  <Text style={styles.planPrice}>$4.99</Text>
                  <Text style={styles.planPeriod}>
                    {language === 'en' ? 'per month' : 'por mes'}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.notNowButton,
                  pressed && styles.notNowButtonPressed,
                ]}
                onPress={onDismiss}
              >
                <Text style={styles.notNowText}>
                  {language === 'en' ? 'Not Now' : 'Ahora No'}
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    maxHeight: '100%',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as '700',
    color: colors.functional.text,
    textAlign: 'center',
    lineHeight: typography.sizes.xxl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular as '400',
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  featuresContainer: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
    color: colors.functional.text,
    flex: 1,
  },
  plansContainer: {
    gap: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  planCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.functional.border,
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  planCardAnnual: {
    borderColor: colors.primary.purple,
    backgroundColor: colors.primary.lavender,
  },
  planCardPressed: {
    opacity: 0.7,
  },
  saveBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: colors.functional.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
  },
  saveBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold as '700',
    color: colors.neutral.white,
  },
  planName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as '600',
    color: colors.functional.text,
    marginTop: spacing.sm,
  },
  planPrice: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold as '700',
    color: colors.primary.purple,
  },
  planPeriod: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular as '400',
    color: colors.functional.textSecondary,
  },
  planSavings: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
    color: colors.functional.success,
    marginTop: spacing.xs / 2,
  },
  notNowButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  notNowButtonPressed: {
    opacity: 0.6,
  },
  notNowText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
    color: colors.functional.textSecondary,
  },
});

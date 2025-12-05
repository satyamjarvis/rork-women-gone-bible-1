import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { X, Crown, Check, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../constants/colors';

interface SubscriptionPaywallProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectPlan: (tier: 'monthly' | 'annual') => void;
  language: 'en' | 'es';
}

export default function SubscriptionPaywall({ visible, onDismiss, onSelectPlan, language }: SubscriptionPaywallProps) {
  const features = [
    {
      icon: Sparkles,
      en: 'Unlimited personalized prayers',
      es: 'Oraciones personalizadas ilimitadas',
    },
    {
      icon: Crown,
      en: 'Unlimited prayer card downloads',
      es: 'Descargas ilimitadas de tarjetas',
    },
    {
      icon: Check,
      en: 'Share prayers with unlimited friends',
      es: 'Comparte oraciones con amigos ilimitados',
    },
    {
      icon: Sparkles,
      en: 'Priority support',
      es: 'Soporte prioritario',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.neutral.cream, colors.primary.lightBlue]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Crown size={48} color={colors.primary.purple} fill={colors.primary.purple} />
              <Pressable onPress={onDismiss} style={styles.closeButton}>
                <X size={28} color={colors.functional.text} />
              </Pressable>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {language === 'en' 
                  ? 'Unlock Unlimited Prayers & Prayer Cards' 
                  : 'Desbloquea Oraciones y Tarjetas Ilimitadas'}
              </Text>
              <Text style={styles.subtitle}>
                {language === 'en'
                  ? 'Never run out of prayers. Get unlimited access to all features.'
                  : 'Nunca te quedes sin oraciones. Obtén acceso ilimitado a todas las funciones.'}
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <IconComponent size={24} color={colors.primary.purple} />
                    </View>
                    <Text style={styles.featureText}>
                      {language === 'en' ? feature.en : feature.es}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.plansContainer}>
              <Text style={styles.plansTitle}>
                {language === 'en' ? 'Choose Your Plan' : 'Elige Tu Plan'}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.planCard,
                  styles.planCardFeatured,
                  pressed && styles.planCardPressed,
                ]}
                onPress={() => onSelectPlan('annual')}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>
                    {language === 'en' ? 'BEST VALUE' : 'MEJOR VALOR'}
                  </Text>
                </View>
                
                <LinearGradient
                  colors={[colors.primary.purple, colors.primary.teal]}
                  style={styles.planGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.planContent}>
                    <Text style={styles.planNameFeatured}>
                      {language === 'en' ? 'Annual Plan' : 'Plan Anual'}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPriceFeatured}>$39.99</Text>
                      <Text style={styles.planPeriodFeatured}>
                        {language === 'en' ? '/year' : '/año'}
                      </Text>
                    </View>
                    <View style={styles.savingsContainer}>
                      <Text style={styles.savingsText}>
                        {language === 'en' ? 'Save 30% • Just $3.33/month' : 'Ahorra 30% • Solo $3.33/mes'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.planCard,
                  pressed && styles.planCardPressed,
                ]}
                onPress={() => onSelectPlan('monthly')}
              >
                <View style={styles.planContent}>
                  <Text style={styles.planName}>
                    {language === 'en' ? 'Monthly Plan' : 'Plan Mensual'}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>$4.99</Text>
                    <Text style={styles.planPeriod}>
                      {language === 'en' ? '/month' : '/mes'}
                    </Text>
                  </View>
                  <Text style={styles.planDescription}>
                    {language === 'en' ? 'Perfect for trying it out' : 'Perfecto para probarlo'}
                  </Text>
                </View>
              </Pressable>
            </View>

            <Text style={styles.disclaimer}>
              {language === 'en'
                ? 'Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'
                : 'La suscripción se renueva automáticamente a menos que se cancele al menos 24 horas antes del final del período actual.'}
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
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
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold as '700',
    color: colors.functional.text,
    textAlign: 'center',
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular as '400',
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  featuresContainer: {
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium as '500',
    color: colors.functional.text,
    flex: 1,
  },
  plansContainer: {
    gap: spacing.lg,
  },
  plansTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    color: colors.functional.text,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: colors.primary.softBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  planCardFeatured: {
    borderWidth: 3,
    borderColor: colors.primary.purple,
  },
  planCardPressed: {
    opacity: 0.8,
  },
  popularBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.functional.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold as '700',
    color: colors.neutral.white,
  },
  planGradient: {
    padding: spacing.xl,
  },
  planContent: {
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  planName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold as '600',
    color: colors.functional.text,
  },
  planNameFeatured: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    color: colors.neutral.white,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs / 2,
  },
  planPrice: {
    fontSize: 48,
    fontWeight: typography.weights.bold as '700',
    color: colors.primary.purple,
  },
  planPriceFeatured: {
    fontSize: 48,
    fontWeight: typography.weights.bold as '700',
    color: colors.neutral.white,
  },
  planPeriod: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular as '400',
    color: colors.functional.textSecondary,
  },
  planPeriodFeatured: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular as '400',
    color: colors.neutral.white,
    opacity: 0.9,
  },
  planDescription: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular as '400',
    color: colors.functional.textSecondary,
    marginTop: spacing.xs,
  },
  savingsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  savingsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
    color: colors.neutral.white,
  },
  disclaimer: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular as '400',
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.md,
  },
});

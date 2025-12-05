import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useRef } from 'react';
import { ArrowLeft, Heart, Volume2, BookOpen, Trash2, X, Square } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { usePrayer } from '../../contexts/PrayerContext';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';

type VoicePreference = 'female' | 'male';
type ExtendedVoice = Speech.Voice & { gender?: string };

const FEMALE_KEYWORDS = [
  'female',
  'woman',
  'women',
  'samantha',
  'joanna',
  'karen',
  'salli',
  'victoria',
  'susan',
  'ava',
  'emma',
  'sophia',
  'sofia',
  'lucia',
  'paulina',
  'mia',
  'monica',
  'angelica',
  'maria',
  'rosa',
  'anna',
  'clara',
  'elena',
  'ines',
  'valentina',
  'gabriela',
  'carmen',
] as const;

const MALE_KEYWORDS = [
  'male',
  'man',
  'men',
  'david',
  'mark',
  'matthew',
  'jorge',
  'juan',
  'diego',
  'carlos',
  'daniel',
  'edward',
  'henry',
  'james',
  'john',
  'michael',
  'thomas',
  'nathan',
  'andrew',
  'miguel',
  'pedro',
  'alejandro',
  'luis',
  'rafael',
  'roberto',
  'william',
] as const;

export default function PrayerDetailScreen() {
  const router = useRouter();
  const { prayerId } = useLocalSearchParams<{ prayerId: string }>();
  const insets = useSafeAreaInsets();
  const { prayers, toggleFavorite, deletePrayer } = usePrayer();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [showVoiceSelectionModal, setShowVoiceSelectionModal] = useState(false);
  const isIntentionalStop = useRef(false);

  const prayer = useMemo(() => prayers.find((p) => p.id === prayerId), [prayers, prayerId]);

  if (!prayer) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.neutral.cream, colors.primary.lavender]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
            <Text style={styles.errorText}>Prayer not found</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.errorLink}>Go back</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const formatTextForSpeech = (text: string): string => {
    let formatted = text;
    const scripturePattern = /(\d+)\s*:\s*(\d+)/g;
    formatted = formatted.replace(scripturePattern, (match, chapter, verse) => {
      return `chapter ${chapter} section ${verse}`;
    });
    return formatted;
  };

  const handleStop = () => {
    isIntentionalStop.current = true;
    Speech.stop();
    setIsSpeaking(false);
  };

  const handleSpeak = async (voicePreference?: VoicePreference) => {
    if (isSpeaking) {
      Speech.stop();
    }
    
    isIntentionalStop.current = false;

    try {
      setIsSpeaking(true);
      const textToSpeak = formatTextForSpeech(prayer.generatedPrayer);
      const availableVoices = await Speech.getAvailableVoicesAsync();

      console.log('=== AVAILABLE VOICES ===');
      console.log(
        JSON.stringify(
          availableVoices.map((voice) => ({
            name: voice.name,
            lang: voice.language,
            id: voice.identifier,
            quality: voice.quality,
          })),
          null,
          2,
        ),
      );

      if (availableVoices.length === 0) {
        setIsSpeaking(false);
        Alert.alert(
          prayer.language === 'en' ? 'No Voices Available' : 'Sin voces disponibles',
          prayer.language === 'en'
            ? 'Your device does not have any text-to-speech voices installed. Please enable system voices and try again.'
            : 'Tu dispositivo no tiene voces de texto a voz instaladas. Activa las voces del sistema e inténtalo nuevamente.',
        );
        return;
      }

      const detectVoiceGender = (voice: Speech.Voice): VoicePreference | 'unknown' => {
        const extendedVoice = voice as ExtendedVoice;
        const declaredGender = extendedVoice.gender?.toLowerCase();
        if (declaredGender === 'female' || declaredGender === 'male') {
          return declaredGender;
        }
        const normalizedName = voice.name.toLowerCase();
        if (FEMALE_KEYWORDS.some((keyword) => normalizedName.includes(keyword))) {
          return 'female';
        }
        if (MALE_KEYWORDS.some((keyword) => normalizedName.includes(keyword))) {
          return 'male';
        }
        return 'unknown';
      };

      const langCode = prayer.language === 'en' ? 'en' : 'es';
      const languageMatchedVoices = availableVoices.filter((voice) => {
        const voiceLanguage = voice.language?.toLowerCase() ?? '';
        return voiceLanguage.includes(langCode);
      });
      const prioritizedVoices =
        languageMatchedVoices.length > 0 ? languageMatchedVoices : availableVoices;

      const femaleVoices = prioritizedVoices.filter(
        (voice) => detectVoiceGender(voice) === 'female',
      );
      const maleVoices = prioritizedVoices.filter(
        (voice) => detectVoiceGender(voice) === 'male',
      );

      const pickVoice = (): Speech.Voice | undefined => {
        if (voicePreference === 'female' && femaleVoices.length > 0) {
          const enhancedVoice = femaleVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced);
          return enhancedVoice || femaleVoices[0];
        }
        if (voicePreference === 'male' && maleVoices.length > 0) {
          const enhancedVoice = maleVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced);
          
          const premiumMaleVoices = [
            'aaron', 'nathan', 'matthew', 'jorge', 'juan',
            'arthur', 'daniel', 'evan', 'fred', 'gordon',
            'james', 'lee', 'marcus', 'otoya', 'reed',
            'rocko', 'sandy', 'tom', 'albert', 'bad news',
            'bahh', 'bells', 'boing', 'bubbles', 'cellos',
            'eddy', 'flo', 'grandma', 'grandpa', 'jacques',
            'jester', 'organ', 'reed', 'rocko', 'superstar',
            'diego', 'santiago', 'jorge', 'juan', 'tingting'
          ];
          
          const premiumVoice = maleVoices.find(v => {
            const nameLower = v.name.toLowerCase();
            return premiumMaleVoices.some(premium => nameLower.includes(premium));
          });
          
          const defaultVoice = maleVoices.find(v => 
            v.quality === Speech.VoiceQuality.Default && 
            !v.name.toLowerCase().includes('compact')
          );
          
          return enhancedVoice || premiumVoice || defaultVoice || maleVoices[0];
        }
        if (!voicePreference) {
          return prioritizedVoices[0];
        }
        if (voicePreference === 'female' && maleVoices.length > 0) {
          return maleVoices[0];
        }
        if (voicePreference === 'male' && femaleVoices.length > 0) {
          return femaleVoices[0];
        }
        return prioritizedVoices[0];
      };

      const selectedVoice = pickVoice();

      console.log(
        'Selected voice preference:',
        voicePreference ?? 'system-default',
        '| Voice used:',
        selectedVoice?.name ?? 'system default',
      );

      const startSpeech = (voice?: Speech.Voice, hasRetried = false) => {
        const speechOptions: Speech.SpeechOptions = {
          voice: voice?.identifier,
          language: prayer.language === 'en' ? 'en-US' : 'es-US',
          pitch: 1,
          rate: 0.85,
          onDone: () => {
            console.log('Speech completed');
            setIsSpeaking(false);
          },
          onStopped: () => {
            console.log('Speech stopped');
            if (isIntentionalStop.current) {
              setIsSpeaking(false);
            }
          },
          onError: (error) => {
            console.error('=== SPEECH ERROR ===');
            console.error('Speech error:', error);
            
            if (isIntentionalStop.current) {
              console.log('Speech stopped intentionally, ignoring error');
              return;
            }

            if (!hasRetried && voice) {
              console.log('Retrying speech with default system voice');
              startSpeech(undefined, true);
              return;
            }
            setIsSpeaking(false);
            Alert.alert(
              prayer.language === 'en' ? 'Speech Not Available' : 'Lectura no disponible',
              Platform.OS === 'web'
                ? prayer.language === 'en'
                  ? 'Your browser could not play this voice. Try refreshing or using another browser.'
                  : 'Tu navegador no pudo reproducir esta voz. Intenta actualizar o usar otro navegador.'
                : prayer.language === 'en'
                  ? 'This voice is not available on your device. Please download a female and male voice in your system settings.'
                  : 'Esta voz no está disponible en tu dispositivo. Descarga voces en la configuración del sistema.',
            );
          },
        };

        Speech.speak(textToSpeak, speechOptions);
      };

      startSpeech(selectedVoice);
    } catch (error) {
      console.error('Error in handleSpeak:', error);
      setIsSpeaking(false);
      Alert.alert(
        prayer.language === 'en' ? 'Error' : 'Error',
        prayer.language === 'en'
          ? 'Unable to read your prayer. Please try again.'
          : 'No se pudo leer tu oración. Por favor, inténtalo de nuevo.',
      );
    }
  };

  const handleFavorite = () => {
    toggleFavorite(prayer.id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this prayer?');
      if (confirmed) {
        console.log('Deleting prayer from detail:', prayer.id);
        deletePrayer(prayer.id);
        router.back();
      }
    } else {
      Alert.alert(
        'Delete Prayer',
        'Are you sure you want to delete this prayer?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('Deleting prayer from detail:', prayer.id);
              deletePrayer(prayer.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            },
          },
        ]
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };



  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral.cream, colors.primary.lavender]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.primary.mauve} />
            </Pressable>

            <Pressable style={styles.favoriteButton} onPress={handleFavorite}>
              <Heart
                size={24}
                color={colors.primary.mauve}
                fill={prayer.isFavorite ? colors.primary.mauve : 'transparent'}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxxl }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.recipientName}>{prayer.recipientName}</Text>
              <Text style={styles.date}>{formatDate(prayer.createdAt)}</Text>
            </View>

            <View style={styles.prayerCard}>
              <Text style={styles.prayerText}>{prayer.generatedPrayer}</Text>
            </View>

            {prayer.scriptures.length > 0 && (
              <View style={styles.scripturesContainer}>
                <View style={styles.scripturesHeader}>
                  <BookOpen size={20} color={colors.primary.mauve} />
                  <Text style={styles.scripturesTitle}>
                    {prayer.language === 'en' ? 'Scripture Promises' : 'Promesas de las Escrituras'}
                  </Text>
                </View>
                {prayer.scriptures.map((scripture, index) => (
                  <View key={index} style={styles.scriptureCard}>
                    <Text style={styles.scriptureReference}>{scripture.reference}</Text>
                    <Text style={styles.scriptureVerse}>{scripture.verse}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                onPress={() => setShowVoiceSelectionModal(true)}
              >
                <Volume2
                  size={20}
                  color={colors.primary.mauve}
                />
                <Text style={styles.actionButtonText}>
                  {prayer.language === 'en' ? 'Listen' : 'Escuchar'}
                </Text>
              </Pressable>

              {isSpeaking && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.stopButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleStop}
                >
                  <Square
                    size={20}
                    color={colors.functional.error}
                    fill={colors.functional.error}
                  />
                  <Text style={[styles.actionButtonText, styles.stopButtonText]}>
                    {prayer.language === 'en' ? 'Stop' : 'Detener'}
                  </Text>
                </Pressable>
              )}



              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.deleteButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={colors.functional.error} />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                  {prayer.language === 'en' ? 'Delete' : 'Eliminar'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </LinearGradient>


      <Modal
        visible={showVoiceSelectionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceSelectionModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowVoiceSelectionModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {prayer?.language === 'en' ? 'Choose a Voice' : 'Elige una Voz'}
              </Text>
              <Pressable
                onPress={() => setShowVoiceSelectionModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.functional.text} />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              {prayer?.language === 'en'
                ? 'Select the voice you\'d like to hear your prayer read in:'
                : 'Selecciona la voz en la que te gustaría escuchar tu oración:'}
            </Text>

            <View style={styles.voiceOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.voiceOption,
                  pressed && styles.voiceOptionPressed,
                ]}
                onPress={() => {
                  setShowVoiceSelectionModal(false);
                  setTimeout(() => handleSpeak('female'), 100);
                }}
              >
                <Text style={styles.voiceOptionText}>
                  {prayer?.language === 'en' ? 'Female Voice' : 'Voz femenina'}
                </Text>
                <Text style={styles.voiceOptionSubtext}>
                  {prayer?.language === 'en' ? 'Soft & nurturing tone' : 'Tono suave y acogedor'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.voiceOption,
                  pressed && styles.voiceOptionPressed,
                ]}
                onPress={() => {
                  setShowVoiceSelectionModal(false);
                  setTimeout(() => handleSpeak('male'), 100);
                }}
              >
                <Text style={styles.voiceOptionText}>
                  {prayer?.language === 'en' ? 'Male Voice' : 'Voz masculina'}
                </Text>
                <Text style={styles.voiceOptionSubtext}>
                  {prayer?.language === 'en' ? 'Calm & steady tone' : 'Tono sereno y firme'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  titleContainer: {
    gap: spacing.xs,
  },
  recipientName: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
  },
  date: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  errorLink: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.primary.mauve,
  },
  prayerCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.primary.lilac,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  prayerText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  scripturesContainer: {
    gap: spacing.md,
  },
  scripturesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scripturesTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary.mauve,
  },
  scriptureCard: {
    backgroundColor: colors.primary.lavender,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  scriptureReference: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary.mauve,
  },
  scriptureVerse: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary.lilac,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary.mauve,
  },
  deleteButton: {
    backgroundColor: colors.primary.softPink,
  },
  deleteButtonText: {
    color: colors.functional.error,
  },
  stopButton: {
    backgroundColor: colors.neutral.white,
    borderColor: colors.functional.error,
    borderWidth: 1,
  },
  stopButtonText: {
    color: colors.functional.error,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    flex: 1,
  },
  modalDescription: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  voiceOptions: {
    gap: spacing.md,
  },
  voiceOption: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.functional.border,
    shadowColor: colors.primary.softBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceOptionPressed: {
    opacity: 0.7,
    borderColor: colors.primary.mauve,
  },
  voiceOptionText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
    marginBottom: spacing.xs / 2,
  },
  voiceOptionSubtext: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
  },

});

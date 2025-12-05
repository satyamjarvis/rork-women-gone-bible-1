import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform, KeyboardAvoidingView, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import type { PrayerType, Language } from '../../types/prayer';

export default function PrayerInputScreen() {
  const router = useRouter();
  const { type, name, language } = useLocalSearchParams<{
    type: PrayerType;
    name: string;
    language: Language;
  }>();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleContinue = () => {
    if (input.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push({
        pathname: '/prayer/result',
        params: { type, name, language, input },
      });
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

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language === 'en' ? 'en-US' : 'es-ES';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            Alert.alert(
              language === 'en' ? 'Microphone Access Denied' : 'Acceso al Micrófono Denegado',
              language === 'en'
                ? 'Please allow microphone access in your browser settings to use voice input.'
                : 'Por favor, permite el acceso al micrófono en la configuración de tu navegador para usar la entrada de voz.'
            );
          } else if (event.error === 'no-speech') {
            Alert.alert(
              language === 'en' ? 'No Speech Detected' : 'No se Detectó Voz',
              language === 'en'
                ? 'Please try speaking again.'
                : 'Por favor, intenta hablar de nuevo.'
            );
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current && Platform.OS === 'web') {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition cleanup error:', e);
        }
      }
    };
  }, [language]);

  const handleMicPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        Alert.alert(
          language === 'en' ? 'Not Supported' : 'No Compatible',
          language === 'en'
            ? 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
            : 'El reconocimiento de voz no es compatible con este navegador. Por favor, usa Chrome, Edge o Safari.'
        );
        return;
      }

      if (isRecording) {
        try {
          recognitionRef.current?.stop();
          setIsRecording(false);
        } catch (e) {
          console.error('Error stopping recognition:', e);
          setIsRecording(false);
        }
      } else {
        try {
          recognitionRef.current?.start();
          setIsRecording(true);
        } catch (e) {
          console.error('Error starting recognition:', e);
          Alert.alert(
            language === 'en' ? 'Error' : 'Error',
            language === 'en'
              ? 'Could not start voice recognition. Please try again.'
              : 'No se pudo iniciar el reconocimiento de voz. Por favor, inténtalo de nuevo.'
          );
        }
      }
    } else {
      Haptics.selectionAsync();
      setIsRecording(!isRecording);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.neutral.lightGray }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.content, { paddingTop: Platform.OS === 'web' ? insets.top + spacing.md : insets.top + spacing.xs, paddingBottom: Platform.OS === 'web' ? insets.bottom + spacing.md : insets.bottom + spacing.xs }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.primary.teal} strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <Text style={styles.badge}>Guided Prayer</Text>
            
            <Text style={styles.title}>In your own words, what is on your heart?</Text>
            <Text style={styles.subtitle}>
              {type === 'myself' 
                ? "Share what is heavy, confusing, or quietly hopeful in your own life. You can write in full sentences, fragments, or simple phrases."
                : "Share what you see, sense, or carry for her. You do not have to explain everything. You can write in full sentences, fragments, or simple phrases."
              }
            </Text>
            <Text style={styles.hint}>
              You can start with: Today I feel... / I am afraid that... / I am grateful for...
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={
                language === 'en'
                  ? 'Type what you want to pray about...'
                  : 'Escribe sobre lo que quieres orar...'
              }
              placeholderTextColor={colors.functional.textSecondary}
              multiline
              textAlignVertical="top"
              autoFocus
              returnKeyType="default"
              blurOnSubmit={false}
            />

            {Platform.OS === 'web' && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.micButton,
                    isRecording && styles.micButtonRecording,
                    pressed && styles.micButtonPressed,
                  ]}
                  onPress={handleMicPress}
                >
                  {isRecording ? (
                    <MicOff size={24} color={colors.neutral.white} />
                  ) : (
                    <Mic size={24} color={colors.neutral.white} />
                  )}
                </Pressable>

                {isRecording && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>
                      {language === 'en' ? 'Listening...' : 'Escuchando...'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            style={[
              styles.button,
              !input.trim() && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            onPressIn={input.trim() ? handlePressIn : undefined}
            onPressOut={input.trim() ? handlePressOut : undefined}
            disabled={!input.trim()}
          >
            <Text style={[styles.buttonText, !input.trim() && styles.buttonTextDisabled]}>
              {language === 'en' ? 'Continue to prayer' : 'Continuar a la oración'}
            </Text>
          </Pressable>
        </Animated.View>
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginLeft: -spacing.sm,
    marginBottom: spacing.sm,
  },
  backText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.primary.teal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: Platform.OS === 'web' ? spacing.xl : spacing.md,
  },
  topSection: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  badge: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary.teal,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: Platform.OS === 'web' ? typography.sizes.xxl : typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    lineHeight: Platform.OS === 'web' ? typography.sizes.xxl * typography.lineHeights.tight : typography.sizes.xl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? typography.sizes.base : typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: Platform.OS === 'web' ? typography.sizes.base * typography.lineHeights.relaxed : typography.sizes.sm * 1.4,
  },
  hint: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    fontStyle: 'italic',
    lineHeight: typography.sizes.sm * 1.4,
  },
  inputContainer: {
    gap: spacing.md,
    minHeight: Platform.OS === 'web' ? 200 : 140,
    flex: 0,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
    borderWidth: 1,
    borderColor: colors.functional.border,
    minHeight: Platform.OS === 'web' ? 150 : 120,
    maxHeight: Platform.OS === 'web' ? 300 : 180,
  },
  micButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.full,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonRecording: {
    backgroundColor: colors.functional.error,
  },
  micButtonPressed: {
    opacity: 0.8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-end',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.functional.error,
  },
  recordingText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.functional.error,
  },
  button: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.full,
    paddingVertical: Platform.OS === 'web' ? spacing.md + spacing.xs : spacing.md,
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? spacing.md : spacing.sm,
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
});

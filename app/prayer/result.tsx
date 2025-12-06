import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform, Alert, Modal, TextInput, Linking, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Heart, Volume2, BookOpen, Send, X, User, BookHeart, Square, Download, Image as ImageIcon } from 'lucide-react-native';
import UpgradeModal from '../../components/UpgradeModal';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import { usePrayer } from '../../contexts/PrayerContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import type { PrayerType, Language, Prayer } from '../../types/prayer';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

type VoicePreference = 'female' | 'male';
type ExtendedVoice = Speech.Voice & { gender?: string };

const CARD_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
] as const;

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
  'isabela',
  'isabella',
  'catalina',
  'esperanza',
  'paloma',
  'marisol',
  'alejandra',
  'fernanda',
  'dora',
  'lupe',
  'guadalupe',
  'consuela',
  'pilar',
  'mercedes',
  'dolores',
  'francisca',
  'josefina',
  'rosita',
  'teresita',
  'mariana',
  'tatiana',
  'veronica',
  'fiona',
  'nora',
  'mónica',
  'tessa',
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

export default function PrayerResultScreen() {
  const router = useRouter();
  const { type, name, language, input } = useLocalSearchParams<{
    type: PrayerType;
    name: string;
    language: Language;
    input: string;
  }>();
  const insets = useSafeAreaInsets();
  const { addPrayer } = usePrayer();
  const { incrementPrayerGeneration, incrementCardDownload, incrementPrayerSharing, incrementAudioListen, canUsePrayerGeneration, canUseCardDownload, canUsePrayerSharing, canUseAudioListen, isPremium, upgradeToPremium } = useSubscription();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [generatedPrayer, setGeneratedPrayer] = useState<Prayer | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [showListenAgainModal, setShowListenAgainModal] = useState(false);
  const [showVoiceSelectionModal, setShowVoiceSelectionModal] = useState(false);
  const isIntentionalStop = useRef(false);
  const [showPrayerCard, setShowPrayerCard] = useState(false);
  const prayerCardRef = useRef<View>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [backgroundBase64, setBackgroundBase64] = useState<string>('');
  const LOGO_URL = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6575lbjtdmfsuegatzyos';
  const hasRequestedPrayer = useRef(false);

  const generatePrayerMutation = useMutation({
    mutationFn: async () => {
      console.log('[generatePrayerMutation] Starting prayer generation');
      console.log('[generatePrayerMutation] Params:', { type, name, language, inputLength: input?.length || 0 });
      
      const promptLang = language === 'en' ? 'English' : 'Spanish';
      const recipientContext = type === 'myself' ? `for ${name} (who is praying for themselves)` : `for ${name}`;

      const systemPrompt = `You are a compassionate prayer writer inspired by Stormie Omartian's style - deeply personal, nurturing, hope-filled, and rooted in Scripture. 

Context:
- This is a prayer ${recipientContext}
- User's heart: ${input}
- Language: ${promptLang}

Write a beautiful, personal prayer that:
1. Opens with "Dear ${name}," (or "Querida ${name}," in Spanish)
2. Speaks directly to their heart with warmth and understanding
3. Addresses their specific situation with hope and comfort
4. Includes 2-3 relevant Bible verses woven naturally into the prayer
5. Ends with affirmation that they are loved, seen, and never alone
6. Is 200-300 words
7. Feels like a loving friend praying over them

CRITICAL: For the scripture verses, you MUST provide the EXACT, WORD-FOR-WORD text from the Bible${language === 'es' ? ' IN SPANISH' : ''}. ${language === 'es' ? 'Use a Spanish Bible translation such as Reina-Valera 1960 (RVR1960) or Nueva Versión Internacional (NVI). ' : ''}Do not paraphrase, summarize, or modify the verses in any way. Use the exact wording from a standard Bible translation${language === 'es' ? ' (Spanish)' : ' (NIV, ESV, or NKJV)'}. Every word must be spelled correctly and match the original Bible text precisely. This is extremely important - the verses must be 100% accurate with no spelling errors or changes to the wording${language === 'es' ? ' and MUST BE IN SPANISH' : ''}.`;

      const schema = z.object({
        prayer: z.string().describe('The full prayer text'),
        scriptures: z.array(
          z.object({
            reference: z.string().describe('Bible reference (e.g., "Philippians 4:6-7" or "Filipenses 4:6-7" for Spanish)'),
            verse: z.string().describe(`The EXACT verse text from the Bible - word-for-word, with perfect spelling and punctuation${language === 'es' ? ' IN SPANISH from a Spanish Bible translation (RVR1960 or NVI)' : ''}. Must match the original Bible text precisely with zero errors or modifications.`),
          })
        ).min(1).describe(`Array of 1-5 relevant Bible verses with EXACT text from Scripture${language === 'es' ? ' IN SPANISH' : ''}. Must include at least 1 verse.`),
      });

      console.log('[generatePrayerMutation] Calling AI generateObject');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout. Please check your connection and try again.')), 60000);
      });
      
      let parsedResponse;
      try {
        parsedResponse = await Promise.race([
          generateObject({
            messages: [
              {
                role: 'user',
                content: systemPrompt,
              },
            ],
            schema,
          }),
          timeoutPromise,
        ]) as any;
        console.log('[generatePrayerMutation] AI Response received:', {
          hasPrayer: !!parsedResponse?.prayer,
          scripturesCount: parsedResponse?.scriptures?.length || 0
        });
      } catch (aiError) {
        console.error('[generatePrayerMutation] AI generation error:', aiError);
        throw aiError instanceof Error ? aiError : new Error('Failed to generate prayer. Please try again.');
      }

      const prayer: Prayer = {
        id: `prayer_${Date.now()}`,
        type: type as PrayerType,
        recipientName: name,
        language: language as Language,
        userInput: input,
        generatedPrayer: parsedResponse.prayer,
        scriptures: parsedResponse.scriptures,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        cardBackgroundIndex: Math.floor(Math.random() * CARD_BACKGROUNDS.length),
      };

      console.log('[generatePrayerMutation] Prayer object created:', prayer.id);
      return prayer;
    },
    onSuccess: (prayer) => {
      console.log('[generatePrayerMutation] Prayer generation successful:', prayer.id);
      console.log('[generatePrayerMutation] Incrementing usage counter after successful generation');
      incrementPrayerGeneration(type as PrayerType);
      setGeneratedPrayer(prayer);
    },
    onError: (error) => {
      console.error('[generatePrayerMutation] Mutation error:', error);
      console.log('[generatePrayerMutation] NOT incrementing usage counter due to error');
    },
    retry: 1,
    retryDelay: 1000,
  });

  const { isPending: isPrayerPending, mutate: mutatePrayer, isError: isPrayerError, error: prayerError } = generatePrayerMutation;

  useEffect(() => {
    if (hasRequestedPrayer.current || generatedPrayer || isPrayerPending) {
      return;
    }
    
    console.log('[PrayerResult] Mount effect - checking daily limit BEFORE any action');
    console.log('[PrayerResult] Platform:', Platform.OS);
    console.log('[PrayerResult] isPremium:', isPremium);
    console.log('[PrayerResult] type:', type);
    console.log('[PrayerResult] canUsePrayerGeneration for type:', type, '=', canUsePrayerGeneration(type as PrayerType));
    
    const canGenerate = isPremium || canUsePrayerGeneration(type as PrayerType);
    
    if (!canGenerate) {
      console.log('[PrayerResult] ❌ Daily limit reached - showing upgrade modal WITHOUT starting loading');
      hasRequestedPrayer.current = true;
      setShowUpgradeModal(true);
      return;
    }
    
    console.log('[PrayerResult] ✅ Daily limit OK - starting prayer generation');
    console.log('[PrayerResult] Usage counter will be incremented ONLY after successful generation');
    hasRequestedPrayer.current = true;
    mutatePrayer();
  }, [type, isPremium, canUsePrayerGeneration, mutatePrayer, generatedPrayer, isPrayerPending]);

  useEffect(() => {
    if (Platform.OS === 'web' && generatedPrayer) {
      const loadImagesAsBase64 = async () => {
        try {
          console.log('[Web] Converting logo to base64');
          const proxyUrl = 'https://corsproxy.io/?';
          const logoResponse = await fetch(proxyUrl + encodeURIComponent(LOGO_URL));
          if (!logoResponse.ok) {
            throw new Error(`Failed to fetch logo: ${logoResponse.status}`);
          }
          const logoBlob = await logoResponse.blob();
          const logoReader = new FileReader();
          logoReader.onloadend = () => {
            const base64data = logoReader.result as string;
            console.log('[Web] Logo converted to base64 successfully');
            setLogoBase64(base64data);
            setLogoLoaded(true);
          };
          logoReader.onerror = () => {
            console.error('[Web] FileReader error for logo');
            setLogoLoaded(true);
          };
          logoReader.readAsDataURL(logoBlob);
        } catch (error) {
          console.error('[Web] Failed to convert logo to base64:', error);
          setLogoLoaded(true);
        }

        try {
          console.log('[Web] Converting background to base64');
          const bgUrl = CARD_BACKGROUNDS[generatedPrayer.cardBackgroundIndex ?? 0];
          const proxyUrl = 'https://corsproxy.io/?';
          const bgResponse = await fetch(proxyUrl + encodeURIComponent(bgUrl));
          if (!bgResponse.ok) {
            throw new Error(`Failed to fetch background: ${bgResponse.status}`);
          }
          const bgBlob = await bgResponse.blob();
          const bgReader = new FileReader();
          bgReader.onloadend = () => {
            const base64data = bgReader.result as string;
            console.log('[Web] Background converted to base64 successfully');
            setBackgroundBase64(base64data);
            setBackgroundLoaded(true);
          };
          bgReader.onerror = () => {
            console.error('[Web] FileReader error for background');
            setBackgroundLoaded(true);
          };
          bgReader.readAsDataURL(bgBlob);
        } catch (error) {
          console.error('[Web] Failed to convert background to base64:', error);
          setBackgroundLoaded(true);
        }
      };
      loadImagesAsBase64();
    }
  }, [generatedPrayer]);

  const handleSave = () => {
    if (generatedPrayer && !isSaved) {
      console.log('Saving prayer to My Prayers:', generatedPrayer.id);
      addPrayer(generatedPrayer);
      setIsSaved(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      if (Platform.OS === 'web') {
        alert(
          language === 'en' 
            ? 'Prayer saved! Check the My Prayers tab to view it.' 
            : 'Oración guardada! Revisa la pestaña Mis Oraciones para verla.'
        );
      } else {
        Alert.alert(
          language === 'en' ? 'Saved!' : '¡Guardado!',
          language === 'en' 
            ? 'Your prayer has been saved to My Prayers. Go to My Prayers tab to view it.' 
            : 'Tu oración ha sido guardada en Mis Oraciones. Ve a la pestaña Mis Oraciones para verla.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      }
    }
  };



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
    if (!generatedPrayer) return;

    if (isSpeaking) {
      Speech.stop();
    }
    
    incrementAudioListen();
    isIntentionalStop.current = false;

    try {
      setIsSpeaking(true);
      const textToSpeak = formatTextForSpeech(generatedPrayer.generatedPrayer);
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
          language === 'en' ? 'No Voices Available' : 'Sin voces disponibles',
          language === 'en'
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

      const langCode = language === 'en' ? 'en' : 'es';
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

      console.log(`Found ${femaleVoices.length} female voices and ${maleVoices.length} male voices for language: ${langCode}`);
      console.log('Female voices:', femaleVoices.map((v) => ({ name: v.name, identifier: v.identifier, language: v.language })));
      console.log('Male voices:', maleVoices.map((v) => ({ name: v.name, identifier: v.identifier, language: v.language })));

      const pickVoice = (): Speech.Voice | undefined => {
        if (voicePreference === 'female') {
          if (femaleVoices.length > 0) {
            const enhancedVoice = femaleVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced);
            return enhancedVoice || femaleVoices[0];
          }
          console.warn('No female voices found, using first available voice as fallback');
          return prioritizedVoices[0];
        }
        if (voicePreference === 'male') {
          if (maleVoices.length > 0) {
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
          console.warn('No male voices found, using first available voice as fallback');
          return prioritizedVoices[0];
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
          language: language === 'en' ? 'en-US' : 'es-ES',
          pitch: 1,
          rate: 0.85,
          onDone: () => {
            console.log('Speech completed');
            setIsSpeaking(false);
            setShowListenAgainModal(true);
          },
          onStopped: () => {
            console.log('Speech stopped');
            setIsSpeaking(false);
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
              language === 'en' ? 'Speech Not Available' : 'Lectura no disponible',
              Platform.OS === 'web'
                ? language === 'en'
                  ? 'Your browser could not play this voice. Try refreshing or using another browser.'
                  : 'Tu navegador no pudo reproducir esta voz. Intenta actualizar o usar otro navegador.'
                : language === 'en'
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
        language === 'en' ? 'Error' : 'Error',
        language === 'en'
          ? 'Unable to read your prayer. Please try again.'
          : 'No se pudo leer tu oración. Por favor, inténtalo de nuevo.',
      );
    }
  };



  const handleSendToFriend = () => {
    setShowSendModal(true);
  };

  const handleSendSMS = async () => {
    if (!phoneNumber.trim() || !generatedPrayer) {
      Alert.alert(
        language === 'en' ? 'Phone Number Required' : 'Número de Teléfono Requerido',
        language === 'en' 
          ? 'Please enter a US phone number to send the prayer' 
          : 'Por favor ingresa un número de teléfono de EE.UU. para enviar la oración'
      );
      return;
    }
    
    console.log('[PrayerResult] Checking prayer sharing quota before SMS');
    console.log('[PrayerResult] isPremium:', isPremium, 'canUsePrayerSharing:', canUsePrayerSharing);
    if (!isPremium && !canUsePrayerSharing) {
      console.log('[PrayerResult] Prayer sharing quota exceeded, showing upgrade modal');
      setShowSendModal(false);
      setShowUpgradeModal(true);
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      Alert.alert(
        language === 'en' ? 'Invalid Phone Number' : 'Número de Teléfono Inválido',
        language === 'en' 
          ? 'Please enter a valid US phone number (10 digits)' 
          : 'Por favor ingresa un número de teléfono válido de EE.UU. (10 dígitos)'
      );
      return;
    }

    const formattedPhone = cleanPhone.length === 11 && cleanPhone.startsWith('1') 
      ? cleanPhone.substring(1) 
      : cleanPhone;

    try {
      const scriptureText = generatedPrayer.scriptures
        .map(s => `${s.verse} — ${s.reference}`)
        .join('\n\n');
      
      const messageBody = `A prayer for you:\n\n${generatedPrayer.generatedPrayer}\n\nScripture Promises:\n${scriptureText}\n\n- Sent with love from Women Gone Bible`;
      const smsBody = encodeURIComponent(messageBody);
      
      incrementPrayerSharing();
      console.log('Opening SMS with:', { phoneNumber: formattedPhone, bodyLength: messageBody.length });
      
      if (Platform.OS === 'ios') {
        const smsUrl = `sms:${formattedPhone}&body=${smsBody}`;
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
        } else {
          Alert.alert(
            language === 'en' ? 'Unable to Send' : 'No se Puede Enviar',
            language === 'en' 
              ? 'Could not open messaging app. Please try again.' 
              : 'No se pudo abrir la aplicación de mensajes. Por favor, inténtalo de nuevo.'
          );
          return;
        }
      } else if (Platform.OS === 'android') {
        const smsUrl = `sms:${formattedPhone}?body=${smsBody}`;
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
        } else {
          Alert.alert(
            language === 'en' ? 'Unable to Send' : 'No se Puede Enviar',
            language === 'en' 
              ? 'Could not open messaging app. Please try again.' 
              : 'No se pudo abrir la aplicación de mensajes. Por favor, inténtalo de nuevo.'
          );
          return;
        }
      }
      
      setShowSendModal(false);
      setPhoneNumber('');
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        language === 'en' ? 'Opening Messages' : 'Abriendo Mensajes',
        language === 'en' 
          ? 'Your messaging app will open with the prayer ready to send.' 
          : 'Tu aplicación de mensajes se abrirá con la oración lista para enviar.'
      );
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert(
        language === 'en' ? 'Unable to Send' : 'No se Puede Enviar',
        language === 'en' 
          ? 'Your SMS app will open with the prayer ready to send.' 
          : 'Tu aplicación de SMS se abrirá con la oración lista para enviar.'
      );
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress.trim() || !generatedPrayer) {
      Alert.alert(
        language === 'en' ? 'Email Required' : 'Correo Requerido',
        language === 'en' 
          ? 'Please enter an email address to send the prayer' 
          : 'Por favor ingresa un correo electrónico para enviar la oración'
      );
      return;
    }
    
    console.log('[PrayerResult] Checking prayer sharing quota before email');
    console.log('[PrayerResult] isPremium:', isPremium, 'canUsePrayerSharing:', canUsePrayerSharing);
    if (!isPremium && !canUsePrayerSharing) {
      console.log('[PrayerResult] Prayer sharing quota exceeded, showing upgrade modal');
      setShowSendModal(false);
      setShowUpgradeModal(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      Alert.alert(
        language === 'en' ? 'Invalid Email' : 'Correo Inválido',
        language === 'en' 
          ? 'Please enter a valid email address' 
          : 'Por favor ingresa un correo electrónico válido'
      );
      return;
    }

    try {
      const scriptureText = generatedPrayer.scriptures
        .map(s => `${s.verse} — ${s.reference}`)
        .join('\n\n');
      
      const subject = encodeURIComponent('A Prayer for You');
      const body = encodeURIComponent(
        `A prayer for you:\n\n${generatedPrayer.generatedPrayer}\n\nScripture Promises:\n${scriptureText}\n\n- Sent with love from Women Gone Bible`
      );
      
      const mailtoUrl = `mailto:${emailAddress.trim()}?subject=${subject}&body=${body}`;
      
      incrementPrayerSharing();
      console.log('Opening email client with:', { email: emailAddress, bodyLength: body.length });
      
      await Linking.openURL(mailtoUrl);
      
      setShowSendModal(false);
      setEmailAddress('');
      
      Alert.alert(
        language === 'en' ? 'Opening Email' : 'Abriendo Correo',
        language === 'en' 
          ? 'Your email client will open with the prayer ready to send.' 
          : 'Tu cliente de correo se abrirá con la oración lista para enviar.'
      );
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        language === 'en' ? 'Unable to Send' : 'No se Puede Enviar',
        language === 'en' 
          ? 'Could not open email client. Please try again.' 
          : 'No se pudo abrir el cliente de correo. Por favor, inténtalo de nuevo.'
      );
    }
  };

  const handleStartOver = () => {
    router.replace('/(tabs)/pray');
  };

  const handleDownloadCard = async () => {
    try {
      if (!prayerCardRef.current || !generatedPrayer) return;
      
      console.log('[PrayerResult] Checking card download quota');
      console.log('[PrayerResult] isPremium:', isPremium, 'canUseCardDownload:', canUseCardDownload);
      if (!isPremium && !canUseCardDownload) {
        console.log('[PrayerResult] Card download quota exceeded, showing upgrade modal');
        setShowPrayerCard(false);
        setShowUpgradeModal(true);
        return;
      }
      
      console.log('Downloading prayer card for prayer:', generatedPrayer.id);
      
      if (Platform.OS === 'web') {
        console.log('[Web] Image loading status:', { 
          logoBase64Length: logoBase64?.length,
          backgroundBase64Length: backgroundBase64?.length 
        });
        
        if (!logoBase64 || !backgroundBase64) {
          console.log('[Web] Images not loaded yet, waiting up to 5 seconds...');
          
          const maxWaitTime = 5000;
          const checkInterval = 200;
          let elapsedTime = 0;
          
          while ((!logoBase64 || !backgroundBase64) && elapsedTime < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, checkInterval));
            elapsedTime += checkInterval;
            console.log('[Web] Waiting for images...', elapsedTime + 'ms');
          }
          
          if (!logoBase64 || !backgroundBase64) {
            console.error('[Web] Images still not loaded after', maxWaitTime + 'ms');
            throw new Error('Images failed to load. Please close and reopen the prayer card, then try again.');
          }
          
          console.log('[Web] Images loaded successfully after', elapsedTime + 'ms');
        }
      } else {
        if (!logoLoaded || !backgroundLoaded) {
          console.log('[Mobile] Waiting for images to load...');
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      incrementCardDownload();
      
      if (Platform.OS === 'web') {
        const element = prayerCardRef.current as unknown as HTMLElement;
        const html2canvas = (await import('html2canvas')).default;
        
        console.log('[Web] Starting html2canvas capture');
        console.log('[Web] Logo base64 available:', !!logoBase64);
        
        const canvas = await html2canvas(element, {
          backgroundColor: '#FFFFFF',
          scale: 2,
          useCORS: false,
          allowTaint: true,
          logging: false,
        });
        
        console.log('[Web] Canvas created:', canvas.width, 'x', canvas.height);
        const uri = canvas.toDataURL('image/png');
        console.log('[Web] Base64 data length:', uri.length);

        const link = document.createElement('a');
        link.href = uri;
        link.download = `prayer-card-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(
          language === 'en'
            ? 'Prayer card downloaded!'
            : '¡Tarjeta de oración descargada!'
        );
      } else {
        const fileUri = await captureRef(prayerCardRef.current, {
          format: 'png',
          quality: 1,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: language === 'en' ? 'Share Prayer Card' : 'Compartir Tarjeta de Oración',
          });
        }
        
        Alert.alert(
          language === 'en' ? 'Shared!' : '¡Compartido!',
          language === 'en'
            ? 'Prayer card shared successfully!'
            : '¡Tarjeta de oración compartida con éxito!'
        );
      }
      
      setShowPrayerCard(false);
    } catch (error) {
      console.error('Error downloading prayer card:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Error',
        language === 'en'
          ? 'Failed to download prayer card. Please try again.'
          : 'Error al descargar la tarjeta de oración. Por favor, inténtalo de nuevo.'
      );
    }
  };

  if (isPrayerPending || !generatedPrayer) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.neutral.cream, colors.primary.lightTeal]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
            <ActivityIndicator size="large" color={colors.primary.teal} />
            <Text style={styles.loadingText}>
              {language === 'en'
                ? 'Hold on… God is meeting you here.'
                : 'Espera… Dios se encuentra contigo aquí.'}
            </Text>
            <Text style={styles.loadingSubtext}>
              {language === 'en'
                ? 'God hears your heart'
                : 'Dios escucha tu corazón'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (isPrayerError) {
    const errorMessage = prayerError instanceof Error ? prayerError.message : '';
    const isTimeout = errorMessage.includes('timeout');
    
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.neutral.cream, colors.primary.lightTeal]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
            <Text style={styles.errorTitle}>
              {language === 'en'
                ? (isTimeout ? 'Request Timed Out' : 'Something Went Wrong')
                : (isTimeout ? 'Tiempo de Espera Agotado' : 'Algo Salió Mal')}
            </Text>
            <Text style={styles.errorText}>
              {language === 'en'
                ? (isTimeout 
                    ? 'The request took too long. Please check your internet connection and try again.'
                    : errorMessage || 'Unable to generate prayer. Please try again.')
                : (isTimeout
                    ? 'La solicitud tardó demasiado. Verifica tu conexión a internet e inténtalo de nuevo.'
                    : errorMessage || 'No se pudo generar la oración. Por favor, inténtalo de nuevo.')}
            </Text>
            <Pressable style={styles.retryButton} onPress={handleStartOver}>
              <Text style={styles.retryButtonText}>
                {language === 'en' ? 'Try Again' : 'Intentar de nuevo'}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral.cream, colors.primary.lightTeal]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.content, { paddingTop: Platform.OS === 'web' ? insets.top + spacing.md : spacing.sm }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxxl }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.prayerCard}>
              <Text style={styles.prayerText}>{generatedPrayer.generatedPrayer}</Text>
            </View>

            <View style={styles.scripturesContainer}>
              <View style={styles.scripturesHeader}>
                <BookOpen size={20} color={colors.primary.purple} />
                <Text style={styles.scripturesTitle}>
                  {language === 'en' ? 'Scripture Promises' : 'Promesas de las Escrituras'}
                </Text>
              </View>
              {generatedPrayer.scriptures.map((scripture, index) => (
                <View key={index} style={styles.scriptureCard}>
                  <Text style={styles.scriptureReference}>{scripture.reference}</Text>
                  <Text style={styles.scriptureVerse}>{scripture.verse}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={() => {
                  console.log('[PrayerResult] Listen button pressed');
                  console.log('[PrayerResult] isPremium:', isPremium, 'canUseAudioListen:', canUseAudioListen);
                  if (!isPremium && !canUseAudioListen) {
                    console.log('[PrayerResult] Audio listen quota exceeded, showing upgrade modal');
                    setShowUpgradeModal(true);
                    return;
                  }
                  setShowVoiceSelectionModal(true);
                }}
              >
                <Volume2
                  size={20}
                  color={colors.primary.teal}
                />
                <Text style={styles.actionButtonText}>
                  {language === 'en' ? 'Listen' : 'Escuchar'}
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
                    {language === 'en' ? 'Stop' : 'Detener'}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  isSaved && styles.actionButtonSaved,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={handleSave}
              >
                <Heart 
                  size={20} 
                  color={isSaved ? colors.functional.success : colors.primary.purple}
                  fill={isSaved ? colors.functional.success : 'transparent'}
                />
                <Text style={[styles.actionButtonText, isSaved && styles.actionButtonTextSaved]}>
                  {isSaved
                    ? (language === 'en' ? 'Saved' : 'Guardado')
                    : (language === 'en' ? 'Save' : 'Guardar')}
                </Text>
              </Pressable>



              {type === 'send' && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleSendToFriend}
                >
                  <Send size={20} color={colors.primary.pink} />
                  <Text style={styles.actionButtonText}>
                    {language === 'en' ? 'Send' : 'Enviar'}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={() => setShowPrayerCard(true)}
              >
                <ImageIcon size={20} color={colors.primary.teal} />
                <Text style={styles.actionButtonText}>
                  {language === 'en' ? 'Prayer Card' : 'Tarjeta de Oración'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.newPrayerButton,
                pressed && styles.newPrayerButtonPressed,
              ]}
              onPress={handleStartOver}
            >
              <LinearGradient
                colors={[colors.primary.teal, colors.primary.purple]}
                style={styles.newPrayerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.newPrayerButtonText}>
                  {language === 'en' ? 'Create Another Prayer' : 'Crear Otra Oración'}
                </Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>

        <View style={[styles.bottomTab, { paddingBottom: insets.bottom }]}>
          <Pressable
            style={styles.tabButton}
            onPress={() => router.push('/(tabs)/pray')}
          >
            <Heart size={24} color={colors.functional.textSecondary} />
            <Text style={styles.tabLabel}>Pray</Text>
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => router.push('/(tabs)/prayers')}
          >
            <BookHeart size={24} color={colors.functional.textSecondary} />
            <Text style={styles.tabLabel}>My Prayers</Text>
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <User size={24} color={colors.functional.textSecondary} />
            <Text style={styles.tabLabel}>Profile</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <Modal
        visible={showSendModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSendModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowSendModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'en' ? 'Send Prayer to Friend' : 'Enviar Oración a Amiga'}
              </Text>
              <Pressable
                onPress={() => setShowSendModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.functional.text} />
              </Pressable>
            </View>

            {Platform.OS === 'web' ? (
              <>
                <Text style={styles.modalDescription}>
                  {language === 'en'
                    ? 'Enter an email address to send this prayer. Your email client will open with the prayer ready to send.'
                    : 'Ingresa un correo electrónico para enviar esta oración. Tu cliente de correo se abrirá con la oración lista para enviar.'}
                </Text>

                <TextInput
                  style={styles.phoneInput}
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  placeholder={language === 'en' ? 'friend@example.com' : 'amiga@ejemplo.com'}
                  placeholderTextColor={colors.functional.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.sendButton,
                    !emailAddress.trim() && styles.sendButtonDisabled,
                    pressed && styles.sendButtonPressed,
                  ]}
                  onPress={handleSendEmail}
                  disabled={!emailAddress.trim()}
                >
                  <Text style={[styles.sendButtonText, !emailAddress.trim() && styles.sendButtonTextDisabled]}>
                    {language === 'en' ? 'Send Prayer' : 'Enviar Oración'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalDescription}>
                  {language === 'en'
                    ? 'Enter a US phone number to send this prayer via text message. Your messaging app will open with the prayer ready to send.'
                    : 'Ingresa un número de teléfono de EE.UU. para enviar esta oración por mensaje de texto. Tu aplicación de mensajes se abrirá con la oración lista para enviar.'}
                </Text>

                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder={language === 'en' ? '(555) 123-4567' : '(555) 123-4567'}
                  placeholderTextColor={colors.functional.textSecondary}
                  keyboardType="phone-pad"
                  autoFocus
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.sendButton,
                    !phoneNumber.trim() && styles.sendButtonDisabled,
                    pressed && styles.sendButtonPressed,
                  ]}
                  onPress={handleSendSMS}
                  disabled={!phoneNumber.trim()}
                >
                  <Text style={[styles.sendButtonText, !phoneNumber.trim() && styles.sendButtonTextDisabled]}>
                    {language === 'en' ? 'Send Prayer' : 'Enviar Oración'}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>



      <Modal
        visible={showListenAgainModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowListenAgainModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowListenAgainModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'en' ? 'What would you like to do?' : '¿Qué te gustaría hacer?'}
              </Text>
              <Pressable
                onPress={() => setShowListenAgainModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.functional.text} />
              </Pressable>
            </View>

            <View style={styles.listenAgainActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.listenAgainButton,
                  pressed && styles.listenAgainButtonPressed,
                ]}
                onPress={() => {
                  setShowListenAgainModal(false);
                  console.log('[PrayerResult] Listen again button pressed');
                  console.log('[PrayerResult] isPremium:', isPremium, 'canUseAudioListen:', canUseAudioListen);
                  if (!isPremium && !canUseAudioListen) {
                    console.log('[PrayerResult] Audio listen quota exceeded, showing upgrade modal');
                    setShowUpgradeModal(true);
                    return;
                  }
                  setShowVoiceSelectionModal(true);
                }}
              >
                <Volume2 size={24} color={colors.primary.teal} />
                <Text style={styles.listenAgainButtonText}>
                  {language === 'en' ? 'Listen Again' : 'Escuchar de Nuevo'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.listenAgainButton,
                  isSaved && styles.listenAgainButtonSaved,
                  pressed && styles.listenAgainButtonPressed,
                ]}
                onPress={() => {
                  setShowListenAgainModal(false);
                  handleSave();
                }}
              >
                <Heart 
                  size={24} 
                  color={isSaved ? colors.functional.success : colors.primary.purple}
                  fill={isSaved ? colors.functional.success : 'transparent'}
                />
                <Text style={[styles.listenAgainButtonText, isSaved && styles.listenAgainButtonTextSaved]}>
                  {isSaved
                    ? (language === 'en' ? 'Saved' : 'Guardado')
                    : (language === 'en' ? 'Save Prayer' : 'Guardar Oración')}
                </Text>
              </Pressable>


            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showPrayerCard}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrayerCard(false)}
      >
        <View style={styles.cardModalOverlay}>
          <View style={styles.cardModalContent}>
            <View style={styles.cardModalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'en' ? 'Prayer Card' : 'Tarjeta de Oración'}
              </Text>
              <Pressable onPress={() => setShowPrayerCard(false)} style={styles.closeButton}>
                <X size={24} color={colors.functional.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.cardScrollView} contentContainerStyle={styles.cardScrollContent}>
              <View ref={prayerCardRef} collapsable={false} {...(Platform.OS === 'web' ? { 'data-prayer-card': true } : {})}>
                <View style={styles.prayerCardContainer}>
                  {Platform.OS === 'web' ? (
                    backgroundBase64 ? (
                      <img
                        src={backgroundBase64}
                        alt="Background"
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : null
                  ) : (
                    <Image
                      source={{ uri: CARD_BACKGROUNDS[generatedPrayer.cardBackgroundIndex ?? 0] }}
                      style={styles.cardBackgroundImage}
                      onLoad={() => {
                        console.log('[Mobile] Background image loaded successfully');
                        setBackgroundLoaded(true);
                      }}
                      onError={(error) => {
                        console.error('[Mobile] Background image failed to load:', error);
                        setBackgroundLoaded(true);
                      }}
                    />
                  )}
                  <View style={styles.cardOverlay} />
                  
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      {Platform.OS === 'web' ? (
                        logoBase64 ? (
                          <img
                            src={logoBase64}
                            alt="Women Gone Bible Logo"
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: 'contain',
                            }}
                          />
                        ) : null
                      ) : (
                        <Image
                          source={{ uri: LOGO_URL }}
                          style={styles.cardLogo}
                          resizeMode="contain"
                          onLoad={() => {
                            console.log('[Mobile] Logo loaded successfully');
                            setLogoLoaded(true);
                          }}
                          onError={(error) => {
                            console.error('[Mobile] Logo failed to load:', error);
                            setLogoLoaded(true);
                          }}
                        />
                      )}
                    </View>

                    <View style={styles.cardMiddle}>
                      <Text style={styles.cardTitle}>
                        {language === 'en' ? 'Scripture Promises' : 'Promesas de las Escrituras'}
                      </Text>
                    </View>

                    <View style={styles.cardScripturesContainer}>
                      {generatedPrayer.scriptures.map((scripture, index) => (
                        <View key={index} style={styles.cardScriptureItem}>
                          <Text style={styles.cardScriptureVerse} numberOfLines={5}>
                            {`"${scripture.verse}"`}
                          </Text>
                          <Text style={styles.cardScriptureReference}>
                            {`— ${scripture.reference}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.downloadButton,
                pressed && styles.downloadButtonPressed,
              ]}
              onPress={handleDownloadCard}
            >
              <Download size={20} color={colors.neutral.white} />
              <Text style={styles.downloadButtonText}>
                {language === 'en' ? 'Download Card' : 'Descargar Tarjeta'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
                {language === 'en' ? 'Choose a Voice' : 'Elige una Voz'}
              </Text>
              <Pressable
                onPress={() => setShowVoiceSelectionModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.functional.text} />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              {language === 'en'
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
                  {language === 'en' ? 'Female Voice' : 'Voz femenina'}
                </Text>
                <Text style={styles.voiceOptionSubtext}>
                  {language === 'en' ? 'Soft & nurturing tone' : 'Tono suave y acogedor'}
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
                  {language === 'en' ? 'Male Voice' : 'Voz masculina'}
                </Text>
                <Text style={styles.voiceOptionSubtext}>
                  {language === 'en' ? 'Calm & steady tone' : 'Tono sereno y firme'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <UpgradeModal
        visible={showUpgradeModal}
        onDismiss={() => {
          setShowUpgradeModal(false);
          if (!generatedPrayer) {
            router.replace('/(tabs)/pray');
          }
        }}
        onUpgrade={(tier) => {
          console.log('[PrayerResult] Upgrading to:', tier);
          upgradeToPremium(tier);
          setShowUpgradeModal(false);
          if (!generatedPrayer && hasRequestedPrayer.current) {
            console.log('[PrayerResult] Generating prayer after upgrade (usage will be tracked in onSuccess)');
            mutatePrayer();
          }
        }}
        language={language as 'en' | 'es'}
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
    textAlign: 'center',
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
  },
  loadingSubtext: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  retryButton: {
    backgroundColor: colors.primary.teal,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  retryButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
  },
  prayerCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.primary.softBlue,
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
    color: colors.primary.purple,
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
    color: colors.primary.purple,
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
    gap: spacing.sm,
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: colors.primary.softBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonSaved: {
    backgroundColor: colors.functional.successLight || colors.primary.lightTeal,
    borderWidth: 1,
    borderColor: colors.functional.success,
  },
  actionButtonTextSaved: {
    color: colors.functional.success,
  },
  stopButton: {
    backgroundColor: colors.neutral.white,
    borderColor: colors.functional.error,
    borderWidth: 1,
  },
  stopButtonText: {
    color: colors.functional.error,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary.purple,
  },
  newPrayerButton: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: colors.primary.softBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newPrayerButtonPressed: {
    opacity: 0.8,
  },
  newPrayerGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  newPrayerButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
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
  closeButton: {
    padding: spacing.xs,
  },
  modalDescription: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  phoneInput: {
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
    borderWidth: 1,
    borderColor: colors.functional.border,
  },
  sendButton: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral.softGray,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
  },
  sendButtonTextDisabled: {
    color: colors.functional.textSecondary,
  },

  bottomTab: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.functional.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs / 2,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.functional.textSecondary,
  },
  listenAgainActions: {
    gap: spacing.md,
  },
  listenAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
  listenAgainButtonPressed: {
    opacity: 0.7,
  },
  listenAgainButtonSaved: {
    backgroundColor: colors.functional.successLight || colors.primary.lightTeal,
    borderColor: colors.functional.success,
  },
  listenAgainButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  listenAgainButtonTextSaved: {
    color: colors.functional.success,
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
    borderColor: colors.primary.teal,
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
  cardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardModalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  cardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardScrollView: {
    maxHeight: 500,
  },
  cardScrollContent: {
    paddingBottom: spacing.md,
  },
  prayerCardContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  cardContent: {
    position: 'relative',
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  cardLogo: {
    width: 60,
    height: 60,
  },
  cardMiddle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary.purple,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardScripturesContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  cardScriptureItem: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  cardScriptureVerse: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.functional.text,
    lineHeight: typography.sizes.sm * 1.4,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardScriptureReference: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary.purple,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  downloadButton: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  downloadButtonPressed: {
    opacity: 0.8,
  },
  downloadButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
  },
});

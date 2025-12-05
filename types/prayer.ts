export type Language = 'en' | 'es';

export type PrayerType = 'myself' | 'send';

export interface ScriptureReference {
  reference: string;
  verse: string;
}

export interface Prayer {
  id: string;
  type: PrayerType;
  recipientName: string;
  language: Language;
  userInput: string;
  generatedPrayer: string;
  scriptures: ScriptureReference[];
  createdAt: string;
  isFavorite: boolean;
  folderId?: string;
  cardBackgroundIndex?: number;
  hasDownloadedCard?: boolean;
  cardImageBase64?: string;
}

export interface UserProfile {
  name: string;
  preferredLanguage: Language;
  hasCompletedOnboarding: boolean;
  profileImageUri?: string;
  notificationSettings?: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  days: number[];
  time: string;
}

export interface PrayerFolder {
  id: string;
  name: string;
  createdAt: string;
}

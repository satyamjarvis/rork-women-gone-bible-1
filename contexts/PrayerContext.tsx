import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Prayer, UserProfile, Language, PrayerFolder } from '../types/prayer';

const STORAGE_KEYS = {
  PRAYERS: '@wgb_prayers',
  PROFILE: '@wgb_profile',
  FOLDERS: '@wgb_folders',
};

const defaultProfile: UserProfile = {
  name: '',
  preferredLanguage: 'en',
  hasCompletedOnboarding: false,
};

export const [PrayerProvider, usePrayer] = createContextHook(() => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [folders, setFolders] = useState<PrayerFolder[]>([]);

  const prayersQuery = useQuery({
    queryKey: ['prayers'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRAYERS);
        console.log('Loaded prayers from storage:', stored ? JSON.parse(stored).length : 0);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading prayers:', error);
        return [];
      }
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
        console.log('Loaded profile from storage');
        return stored ? JSON.parse(stored) : defaultProfile;
      } catch (error) {
        console.error('Error loading profile:', error);
        return defaultProfile;
      }
    },
  });

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.FOLDERS);
        console.log('Loaded folders from storage:', stored ? JSON.parse(stored).length : 0);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading folders:', error);
        return [];
      }
    },
  });

  const { mutate: mutatePrayers } = useMutation({
    mutationFn: async (prayers: Prayer[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PRAYERS, JSON.stringify(prayers));
      return prayers;
    },
  });

  const { mutate: mutateProfile } = useMutation({
    mutationFn: async (profile: UserProfile) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      return profile;
    },
  });

  const { mutate: mutateFolders } = useMutation({
    mutationFn: async (folders: PrayerFolder[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
      return folders;
    },
  });

  useEffect(() => {
    if (prayersQuery.data) {
      setPrayers(prayersQuery.data);
    }
  }, [prayersQuery.data]);

  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (foldersQuery.data) {
      setFolders(foldersQuery.data);
    }
  }, [foldersQuery.data]);

  const addPrayer = useCallback((prayer: Prayer) => {
    console.log('Adding prayer:', prayer.id);
    const updated = [prayer, ...prayers];
    setPrayers(updated);
    mutatePrayers(updated);
    console.log('Prayer added successfully. Total prayers:', updated.length);
  }, [prayers, mutatePrayers]);

  const toggleFavorite = useCallback((prayerId: string) => {
    const updated = prayers.map((p) =>
      p.id === prayerId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    setPrayers(updated);
    mutatePrayers(updated);
  }, [prayers, mutatePrayers]);

  const deletePrayer = useCallback((prayerId: string) => {
    const updated = prayers.filter((p) => p.id !== prayerId);
    setPrayers(updated);
    mutatePrayers(updated);
  }, [prayers, mutatePrayers]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    mutateProfile(updated);
  }, [profile, mutateProfile]);

  const completeOnboarding = useCallback((name: string, language: Language) => {
    const updated = {
      name,
      preferredLanguage: language,
      hasCompletedOnboarding: true,
    };
    setProfile(updated);
    mutateProfile(updated);
  }, [mutateProfile]);

  const addFolder = useCallback((folderName: string) => {
    const newFolder: PrayerFolder = {
      id: Date.now().toString(),
      name: folderName,
      createdAt: new Date().toISOString(),
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    mutateFolders(updated);
  }, [folders, mutateFolders]);

  const deleteFolder = useCallback((folderId: string) => {
    const updated = folders.filter((f) => f.id !== folderId);
    setFolders(updated);
    mutateFolders(updated);

    const updatedPrayers = prayers.map((p) =>
      p.folderId === folderId ? { ...p, folderId: undefined } : p
    );
    setPrayers(updatedPrayers);
    mutatePrayers(updatedPrayers);
  }, [folders, prayers, mutateFolders, mutatePrayers]);

  const movePrayerToFolder = useCallback((prayerId: string, folderId?: string) => {
    const updated = prayers.map((p) =>
      p.id === prayerId ? { ...p, folderId } : p
    );
    setPrayers(updated);
    mutatePrayers(updated);
  }, [prayers, mutatePrayers]);

  const markPrayerCardDownloaded = useCallback((prayerId: string, cardImageBase64: string) => {
    console.log('[markPrayerCardDownloaded] Marking prayer card as downloaded:', prayerId);
    const updated = prayers.map((p) =>
      p.id === prayerId
        ? { ...p, hasDownloadedCard: true, cardImageBase64 }
        : p
    );
    setPrayers(updated);
    mutatePrayers(updated);
    console.log('[markPrayerCardDownloaded] Prayer card marked as downloaded');
  }, [prayers, mutatePrayers]);

  return useMemo(
    () => ({
      prayers,
      profile,
      folders,
      addPrayer,
      toggleFavorite,
      deletePrayer,
      updateProfile,
      completeOnboarding,
      addFolder,
      deleteFolder,
      movePrayerToFolder,
      markPrayerCardDownloaded,
      isLoading: prayersQuery.isLoading || profileQuery.isLoading,
    }),
    [
      prayers,
      profile,
      folders,
      addPrayer,
      toggleFavorite,
      deletePrayer,
      updateProfile,
      completeOnboarding,
      addFolder,
      deleteFolder,
      movePrayerToFolder,
      markPrayerCardDownloaded,
      prayersQuery.isLoading,
      profileQuery.isLoading,
    ]
  );
});

export function useFilteredPrayers(searchQuery: string) {
  const { prayers } = usePrayer();
  return useMemo(() => {
    if (!searchQuery.trim()) return prayers;
    const query = searchQuery.toLowerCase();
    return prayers.filter(
      (p) =>
        p.recipientName.toLowerCase().includes(query) ||
        p.generatedPrayer.toLowerCase().includes(query) ||
        p.userInput.toLowerCase().includes(query)
    );
  }, [prayers, searchQuery]);
}

export function useFavoritePrayers() {
  const { prayers } = usePrayer();
  return useMemo(() => prayers.filter((p) => p.isFavorite), [prayers]);
}

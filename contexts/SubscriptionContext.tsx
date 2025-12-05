import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';

const STORAGE_KEYS = {
  SUBSCRIPTION: '@wgb_subscription',
  DAILY_USAGE: '@wgb_daily_usage',
};

type SubscriptionTier = 'free' | 'monthly' | 'annual';

interface DailyUsage {
  date: string;
  selfPrayerUsedToday: boolean;
  otherPrayerUsedToday: boolean;
  cardDownloadUsedToday: boolean;
  audioListenUsedToday: boolean;
}

interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt?: string;
}

const getToday = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const defaultSubscription: SubscriptionState = {
  tier: 'free',
};

const defaultDailyUsage: DailyUsage = {
  date: getToday(),
  selfPrayerUsedToday: false,
  otherPrayerUsedToday: false,
  cardDownloadUsedToday: false,
  audioListenUsedToday: false,
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(defaultDailyUsage);

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
        console.log('[Subscription] Loaded subscription from storage');
        return stored ? JSON.parse(stored) : defaultSubscription;
      } catch (error) {
        console.error('[Subscription] Error loading subscription:', error);
        return defaultSubscription;
      }
    },
  });

  const dailyUsageQuery = useQuery({
    queryKey: ['dailyUsage'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_USAGE);
        const today = getToday();
        
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.date === today) {
            console.log('[Subscription] Loaded daily usage:', parsed);
            return parsed;
          } else {
            console.log('[Subscription] Daily usage reset - new day');
            const resetUsage: DailyUsage = { 
              date: today,
              selfPrayerUsedToday: false,
              otherPrayerUsedToday: false,
              cardDownloadUsedToday: false,
              audioListenUsedToday: false,
            };
            await AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(resetUsage));
            return resetUsage;
          }
        }
        
        const newUsage = { ...defaultDailyUsage, date: today };
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(newUsage));
        return newUsage;
      } catch (error) {
        console.error('[Subscription] Error loading daily usage:', error);
        return defaultDailyUsage;
      }
    },
  });

  const { mutate: mutateSubscription } = useMutation({
    mutationFn: async (subscription: SubscriptionState) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscription));
      return subscription;
    },
  });

  const { mutate: mutateDailyUsage } = useMutation({
    mutationFn: async (usage: DailyUsage) => {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(usage));
      return usage;
    },
  });

  useEffect(() => {
    if (subscriptionQuery.data) {
      setSubscription(subscriptionQuery.data);
    }
  }, [subscriptionQuery.data]);

  useEffect(() => {
    if (dailyUsageQuery.data) {
      console.log('[Subscription] Setting daily usage from query:', dailyUsageQuery.data);
      setDailyUsage(dailyUsageQuery.data);
    }
  }, [dailyUsageQuery.data]);

  const isPremium = useCallback((): boolean => {
    if (subscription.tier === 'monthly' || subscription.tier === 'annual') {
      if (subscription.expiresAt) {
        const expiryDate = new Date(subscription.expiresAt);
        const now = new Date();
        return now < expiryDate;
      }
      return false;
    }
    return false;
  }, [subscription]);

  const canUsePrayerGeneration = useCallback((type: 'myself' | 'send'): boolean => {
    const today = getToday();
    if (dailyUsage.date !== today) {
      return true;
    }
    if (isPremium()) {
      return true;
    }
    if (type === 'myself') {
      return !dailyUsage.selfPrayerUsedToday;
    }
    return !dailyUsage.otherPrayerUsedToday;
  }, [isPremium, dailyUsage]);

  const canUseCardDownload = useCallback((): boolean => {
    const today = getToday();
    if (dailyUsage.date !== today) {
      return true;
    }
    if (isPremium()) {
      return true;
    }
    return !dailyUsage.cardDownloadUsedToday;
  }, [isPremium, dailyUsage]);

  const canUsePrayerSharing = useCallback((): boolean => {
    return true;
  }, []);

  const canUseAudioListen = useCallback((): boolean => {
    const today = getToday();
    if (dailyUsage.date !== today) {
      return true;
    }
    if (isPremium()) {
      return true;
    }
    return !dailyUsage.audioListenUsedToday;
  }, [isPremium, dailyUsage]);

  const incrementPrayerGeneration = useCallback((type: 'myself' | 'send') => {
    const today = getToday();
    
    if (dailyUsage.date !== today) {
      const resetUsage: DailyUsage = {
        date: today,
        selfPrayerUsedToday: type === 'myself',
        otherPrayerUsedToday: type === 'send',
        cardDownloadUsedToday: false,
        audioListenUsedToday: false,
      };
      setDailyUsage(resetUsage);
      mutateDailyUsage(resetUsage);
      console.log('[Subscription] Prayer generation flag set for new day:', type);
      return;
    }

    const updated: DailyUsage = {
      ...dailyUsage,
      selfPrayerUsedToday: type === 'myself' ? true : dailyUsage.selfPrayerUsedToday,
      otherPrayerUsedToday: type === 'send' ? true : dailyUsage.otherPrayerUsedToday,
    };
    setDailyUsage(updated);
    mutateDailyUsage(updated);
    console.log('[Subscription] Prayer generation flag set:', type);
  }, [dailyUsage, mutateDailyUsage]);

  const incrementCardDownload = useCallback(() => {
    const today = getToday();
    
    if (dailyUsage.date !== today) {
      const resetUsage: DailyUsage = {
        date: today,
        selfPrayerUsedToday: dailyUsage.selfPrayerUsedToday,
        otherPrayerUsedToday: dailyUsage.otherPrayerUsedToday,
        cardDownloadUsedToday: true,
        audioListenUsedToday: false,
      };
      setDailyUsage(resetUsage);
      mutateDailyUsage(resetUsage);
      console.log('[Subscription] Card download flag set for new day');
      return;
    }

    const updated: DailyUsage = {
      ...dailyUsage,
      cardDownloadUsedToday: true,
    };
    setDailyUsage(updated);
    mutateDailyUsage(updated);
    console.log('[Subscription] Card download flag set');
  }, [dailyUsage, mutateDailyUsage]);

  const incrementPrayerSharing = useCallback(() => {
    console.log('[Subscription] Prayer sharing (no limits)');
  }, []);

  const incrementAudioListen = useCallback(() => {
    const today = getToday();
    
    if (dailyUsage.date !== today) {
      const resetUsage: DailyUsage = {
        date: today,
        selfPrayerUsedToday: dailyUsage.selfPrayerUsedToday,
        otherPrayerUsedToday: dailyUsage.otherPrayerUsedToday,
        cardDownloadUsedToday: dailyUsage.cardDownloadUsedToday,
        audioListenUsedToday: true,
      };
      setDailyUsage(resetUsage);
      mutateDailyUsage(resetUsage);
      console.log('[Subscription] Audio listen flag set for new day');
      return;
    }

    const updated: DailyUsage = {
      ...dailyUsage,
      audioListenUsedToday: true,
    };
    setDailyUsage(updated);
    mutateDailyUsage(updated);
    console.log('[Subscription] Audio listen flag set');
  }, [dailyUsage, mutateDailyUsage]);

  const upgradeToPremium = useCallback((tier: 'monthly' | 'annual') => {
    const expiresAt = new Date();
    if (tier === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const updated: SubscriptionState = {
      tier,
      expiresAt: expiresAt.toISOString(),
    };
    setSubscription(updated);
    mutateSubscription(updated);
    console.log('[Subscription] Upgraded to:', tier, 'expires:', expiresAt);
  }, [mutateSubscription]);



  const getRemainingUsage = useCallback(() => {
    const today = getToday();
    const isNewDay = dailyUsage.date !== today;
    
    if (isPremium()) {
      return {
        prayerGeneration: 'unlimited',
        cardDownload: 'unlimited',
        prayerSharing: 'unlimited',
        audioListen: 'unlimited',
      };
    }
    return {
      selfPrayerUsedToday: isNewDay ? false : dailyUsage.selfPrayerUsedToday,
      otherPrayerUsedToday: isNewDay ? false : dailyUsage.otherPrayerUsedToday,
      cardDownloadUsedToday: isNewDay ? false : dailyUsage.cardDownloadUsedToday,
      audioListenUsedToday: isNewDay ? false : dailyUsage.audioListenUsedToday,
    };
  }, [isPremium, dailyUsage]);

  return useMemo(
    () => ({
      subscription,
      dailyUsage,
      isPremium: isPremium(),
      canUsePrayerGeneration,
      canUseCardDownload: canUseCardDownload(),
      canUsePrayerSharing: canUsePrayerSharing(),
      canUseAudioListen: canUseAudioListen(),
      incrementPrayerGeneration,
      incrementCardDownload,
      incrementPrayerSharing,
      incrementAudioListen,
      upgradeToPremium,
      getRemainingUsage,
      isLoading: subscriptionQuery.isLoading || dailyUsageQuery.isLoading,
    }),
    [
      subscription,
      dailyUsage,
      isPremium,
      canUsePrayerGeneration,
      canUseCardDownload,
      canUsePrayerSharing,
      canUseAudioListen,
      incrementPrayerGeneration,
      incrementCardDownload,
      incrementPrayerSharing,
      incrementAudioListen,
      upgradeToPremium,
      getRemainingUsage,
      subscriptionQuery.isLoading,
      dailyUsageQuery.isLoading,
    ]
  );
});

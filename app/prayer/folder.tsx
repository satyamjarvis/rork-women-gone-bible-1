import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Alert, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { ArrowLeft, MoreVertical, Folder, Trash2, Download } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { usePrayer } from '../../contexts/PrayerContext';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import * as Haptics from 'expo-haptics';
import type { Prayer } from '../../types/prayer';

export default function FolderDetailScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const insets = useSafeAreaInsets();
  const { prayers, folders, deletePrayer, movePrayerToFolder } = usePrayer();
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);

  const folder = useMemo(() => folders.find((f) => f.id === folderId), [folders, folderId]);
  const folderPrayers = useMemo(
    () => prayers.filter((p) => p.folderId === folderId),
    [prayers, folderId]
  );

  if (!folder) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.neutral.cream, colors.primary.lavender]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
            <Text style={styles.errorText}>Folder not found</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.errorLink}>Go back</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleOpenActions = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setShowActionsModal(true);
  };

  const handleDeletePrayer = () => {
    if (!selectedPrayer) return;
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this prayer?');
      if (confirmed) {
        deletePrayer(selectedPrayer.id);
        setShowActionsModal(false);
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
              console.log('Deleting prayer:', selectedPrayer.id);
              deletePrayer(selectedPrayer.id);
              setShowActionsModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    }
  };

  const handleRemoveFromFolder = () => {
    if (!selectedPrayer) return;
    movePrayerToFolder(selectedPrayer.id, undefined);
    setShowActionsModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDownloadPrayerCard = async () => {
    if (!selectedPrayer || !selectedPrayer.cardImageBase64) return;
    
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = selectedPrayer.cardImageBase64;
        link.download = `prayer-card-${selectedPrayer.recipientName}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Prayer card downloaded!');
      } else {
        const fileName = `prayer-card-${Date.now()}.png`;
        const file = new File(Paths.cache, fileName);
        
        const base64Data = selectedPrayer.cardImageBase64.replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        file.create();
        file.write(bytes);
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Prayer Card',
          });
        }
      }
      
      setShowActionsModal(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error downloading prayer card:', error);
      Alert.alert('Error', 'Failed to download prayer card. Please try again.');
    }
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
            <View style={styles.folderInfo}>
              <Folder size={20} color={colors.primary.mauve} />
              <Text style={styles.folderName}>{folder.name}</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {folderPrayers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No prayers in this folder</Text>
              <Text style={styles.emptySubtitle}>
                Move prayers to this folder from the My Prayers tab
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
              showsVerticalScrollIndicator={false}
            >
              {folderPrayers.map((prayer) => (
                <Pressable
                  key={prayer.id}
                  style={({ pressed }) => [
                    styles.prayerCard,
                    pressed && styles.prayerCardPressed,
                  ]}
                  onPress={() => router.push({
                    pathname: '/prayer/detail',
                    params: { prayerId: prayer.id },
                  })}
                >
                  <View style={styles.prayerHeader}>
                    <View style={styles.prayerInfo}>
                      <Text style={styles.prayerName}>{prayer.recipientName}</Text>
                      <Text style={styles.prayerDate}>{formatDate(prayer.createdAt)}</Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenActions(prayer);
                      }}
                      hitSlop={8}
                    >
                      <MoreVertical size={20} color={colors.primary.mauve} />
                    </Pressable>
                  </View>
                  {prayer.cardImageBase64 ? (
                    <Image
                      source={{ uri: prayer.cardImageBase64 }}
                      style={styles.prayerCardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.prayerPreview} numberOfLines={3}>
                      {prayer.generatedPrayer}
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </LinearGradient>

      <Modal
        visible={showActionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionsModal(false)}
        >
          <View style={styles.modalContent}>
            {folder.name === 'Prayer Cards' && selectedPrayer?.cardImageBase64 ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalItem,
                    pressed && styles.modalItemPressed,
                  ]}
                  onPress={handleDownloadPrayerCard}
                >
                  <Download size={20} color={colors.primary.mauve} />
                  <Text style={styles.modalItemText}>Download Prayer Card</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalItem,
                    pressed && styles.modalItemPressed,
                  ]}
                  onPress={handleDeletePrayer}
                >
                  <Trash2 size={20} color={colors.functional.error} />
                  <Text style={[styles.modalItemText, styles.modalItemTextDanger]}>
                    Delete Prayer Card
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalItem,
                    pressed && styles.modalItemPressed,
                  ]}
                  onPress={handleRemoveFromFolder}
                >
                  <Folder size={20} color={colors.primary.mauve} />
                  <Text style={styles.modalItemText}>Remove from Folder</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalItem,
                    pressed && styles.modalItemPressed,
                  ]}
                  onPress={handleDeletePrayer}
                >
                  <Trash2 size={20} color={colors.functional.error} />
                  <Text style={[styles.modalItemText, styles.modalItemTextDanger]}>
                    Delete Prayer
                  </Text>
                </Pressable>
              </>
            )}
          </View>
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
  placeholder: {
    width: 40,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  folderName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary.mauve,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
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
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.primary.lilac,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  prayerCardPressed: {
    opacity: 0.8,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prayerInfo: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  prayerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.functional.text,
  },
  prayerDate: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
  },
  prayerPreview: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  prayerCardImage: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.xs,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  modalItemPressed: {
    opacity: 0.7,
  },
  modalItemText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.functional.text,
  },
  modalItemTextDanger: {
    color: colors.functional.error,
  },
});

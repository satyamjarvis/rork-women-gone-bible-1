import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MoreVertical, Search, FolderPlus, Folder, Trash2, X, ArrowLeft } from 'lucide-react-native';
import { usePrayer, useFilteredPrayers } from '../../contexts/PrayerContext';
import { colors, typography, spacing, borderRadius } from '../../constants/colors';
import * as Haptics from 'expo-haptics';
import type { Prayer } from '../../types/prayer';

export default function PrayersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deletePrayer, movePrayerToFolder, folders, addFolder, deleteFolder } = usePrayer();
  const [searchQuery, setSearchQuery] = useState('');
  const prayers = useFilteredPrayers(searchQuery);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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

  const handleMoveToFolder = () => {
    setShowActionsModal(false);
    setShowFolderModal(true);
  };

  const handleSelectFolder = (folderId?: string) => {
    if (!selectedPrayer) return;
    movePrayerToFolder(selectedPrayer.id, folderId);
    setShowFolderModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      Alert.alert('Folder Name Required', 'Please enter a folder name');
      return;
    }
    addFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };



  const getPrayersByFolder = (folderId?: string) => {
    return prayers.filter((p) => p.folderId === folderId);
  };

  const unfolderedPrayers = getPrayersByFolder(undefined);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.neutral.cream, colors.primary.lavender]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={() => {
                console.log('[PrayersScreen] Back button pressed');
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/pray');
              }}
            >
              <ArrowLeft size={24} color={colors.primary.mauve} />
            </Pressable>
            <Text style={styles.headerTitle}>My Prayers</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={colors.functional.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search prayers..."
                placeholderTextColor={colors.functional.textSecondary}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.folderButton,
                pressed && styles.folderButtonPressed,
              ]}
              onPress={() => setShowNewFolderModal(true)}
            >
              <FolderPlus size={20} color={colors.primary.mauve} />
            </Pressable>
          </View>

          {prayers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No prayers yet</Text>
              <Text style={styles.emptySubtitle}>
                Start your prayer journey and your saved prayers will appear here
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {folders.map((folder) => {
                const folderPrayers = getPrayersByFolder(folder.id);
                if (folderPrayers.length === 0) return null;

                return (
                  <View key={folder.id} style={styles.folderSection}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.folderHeader,
                        pressed && styles.folderHeaderPressed,
                      ]}
                      onPress={() => {
                        console.log('Opening folder:', folder.name, folder.id);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.push({
                          pathname: '/prayer/folder',
                          params: { folderId: folder.id },
                        });
                      }}
                    >
                      <View style={styles.folderInfo}>
                        <Folder size={18} color={colors.primary.mauve} />
                        <Text style={styles.folderName}>{folder.name}</Text>
                        <Text style={styles.folderCount}>({folderPrayers.length})</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          if (Platform.OS === 'web') {
                            const confirmed = window.confirm(`Are you sure you want to delete "${folder.name}"? Prayers will not be deleted.`);
                            if (confirmed) {
                              console.log('Deleting folder:', folder.id);
                              deleteFolder(folder.id);
                              if (Platform.OS !== 'web') {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              }
                            }
                          } else {
                            Alert.alert(
                              'Delete Folder',
                              `Are you sure you want to delete "${folder.name}"? Prayers will not be deleted.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: () => {
                                    console.log('Deleting folder:', folder.id);
                                    deleteFolder(folder.id);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                  },
                                },
                              ]
                            );
                          }
                        }}
                        hitSlop={8}
                      >
                        <Trash2 size={16} color={colors.functional.error} />
                      </Pressable>
                    </Pressable>
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
                        <Text style={styles.prayerPreview} numberOfLines={3}>
                          {prayer.generatedPrayer}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })}

              {unfolderedPrayers.length > 0 && (
                <View style={styles.folderSection}>
                  {unfolderedPrayers.map((prayer) => (
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
                      <Text style={styles.prayerPreview} numberOfLines={3}>
                        {prayer.generatedPrayer}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
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
            <Pressable
              style={({ pressed }) => [
                styles.modalItem,
                pressed && styles.modalItemPressed,
              ]}
              onPress={handleMoveToFolder}
            >
              <Folder size={20} color={colors.primary.mauve} />
              <Text style={styles.modalItemText}>Move to Folder</Text>
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
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFolderModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFolderModal(false)}
        >
          <View style={styles.folderModalContent}>
            <View style={styles.folderModalHeader}>
              <Text style={styles.folderModalTitle}>Move to Folder</Text>
              <Pressable
                onPress={() => setShowFolderModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.functional.text} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.folderModalItem,
                !selectedPrayer?.folderId && styles.folderModalItemSelected,
                pressed && styles.folderModalItemPressed,
              ]}
              onPress={() => handleSelectFolder(undefined)}
            >
              <Text style={styles.folderModalItemText}>No Folder</Text>
            </Pressable>

            <ScrollView style={styles.folderModalScroll}>
              {folders.map((folder) => (
                <Pressable
                  key={folder.id}
                  style={({ pressed }) => [
                    styles.folderModalItem,
                    selectedPrayer?.folderId === folder.id && styles.folderModalItemSelected,
                    pressed && styles.folderModalItemPressed,
                  ]}
                  onPress={() => handleSelectFolder(folder.id)}
                >
                  <Folder size={18} color={colors.primary.mauve} />
                  <Text style={styles.folderModalItemText}>{folder.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showNewFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewFolderModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowNewFolderModal(false)}
          >
            <Pressable
              style={styles.folderModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.folderModalHeader}>
                <Text style={styles.folderModalTitle}>New Folder</Text>
                <Pressable
                  onPress={() => setShowNewFolderModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={colors.functional.text} />
                </Pressable>
              </View>

              <TextInput
                style={styles.folderInput}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Folder name..."
                placeholderTextColor={colors.functional.textSecondary}
                autoFocus
              />

              <Pressable
                style={({ pressed }) => [
                  styles.createFolderButton,
                  !newFolderName.trim() && styles.createFolderButtonDisabled,
                  pressed && styles.createFolderButtonPressed,
                ]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={[
                  styles.createFolderButtonText,
                  !newFolderName.trim() && styles.createFolderButtonTextDisabled,
                ]}>
                  Create Folder
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  folderButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderButtonPressed: {
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.functional.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  folderSection: {
    gap: spacing.md,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  folderHeaderPressed: {
    opacity: 0.7,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  folderName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary.mauve,
  },
  folderCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.functional.textSecondary,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  folderModalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    gap: spacing.md,
  },
  folderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderModalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.functional.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  folderModalScroll: {
    maxHeight: 300,
  },
  folderModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.lightGray,
    marginBottom: spacing.sm,
  },
  folderModalItemSelected: {
    backgroundColor: colors.primary.lavender,
    borderWidth: 2,
    borderColor: colors.primary.mauve,
  },
  folderModalItemPressed: {
    opacity: 0.7,
  },
  folderModalItemText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.functional.text,
  },
  folderInput: {
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
  createFolderButton: {
    backgroundColor: colors.primary.mauve,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createFolderButtonDisabled: {
    backgroundColor: colors.neutral.softGray,
  },
  createFolderButtonPressed: {
    opacity: 0.8,
  },
  createFolderButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
  },
  createFolderButtonTextDisabled: {
    color: colors.functional.textSecondary,
  },
});

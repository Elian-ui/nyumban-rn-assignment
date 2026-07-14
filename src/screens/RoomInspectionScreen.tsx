import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/ui';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomInspection'>;

export function RoomInspectionScreen({ navigation, route }: Props) {
  const isKitchen = route.params.roomId === 'rm_2';
  const [photo, setPhoto] = useState<Asset>();

  function usePickerResponse(response: ImagePickerResponse) {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert(
        'Could not add photo',
        response.errorMessage ?? 'Please try again.',
      );
      return;
    }

    const selectedPhoto = response.assets?.[0];
    if (!selectedPhoto?.uri) {
      return;
    }

    if (selectedPhoto.fileSize && selectedPhoto.fileSize > 5 * 1024 * 1024) {
      Alert.alert(
        'Photo is too large',
        'Choose a photo smaller than 5 MB so it can be synced.',
      );
      return;
    }

    setPhoto(selectedPhoto);
  }

  function takePhoto() {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1600,
        maxHeight: 1600,
        saveToPhotos: false,
      },
      usePickerResponse,
    );
  }

  function choosePhoto() {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1600,
        maxHeight: 1600,
        selectionLimit: 1,
      },
      usePickerResponse,
    );
  }

  function showPhotoOptions() {
    Alert.alert('Add photo evidence', 'Choose where to get the photo.', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from library', onPress: choosePhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>ROOM CONDITION</Text>
      <Text style={styles.title}>
        How is the {route.params.roomName.toLowerCase()}?
      </Text>
      <Text style={styles.subtitle}>
        Choose the condition that best reflects what you see.
      </Text>
      <View style={styles.conditions}>
        {[
          ['Good', 'No action needed', colors.primarySoft, colors.primary],
          ['Fair', 'Minor attention needed', colors.amberSoft, colors.amber],
          ['Poor', 'Repair or replacement needed', colors.redSoft, colors.red],
        ].map(([label, help, bg, color]) => {
          const selected = isKitchen && label === 'Fair';
          return (
            <Pressable
              key={label}
              style={[styles.condition, selected && styles.conditionSelected]}
            >
              <View style={[styles.conditionIcon, { backgroundColor: bg }]}>
                <Text style={[styles.conditionIconText, { color }]}>✓</Text>
              </View>
              <View style={styles.conditionCopy}>
                <Text style={styles.conditionLabel}>{label}</Text>
                <Text style={styles.conditionHelp}>{help}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>
        Notes <Text style={styles.optional}>OPTIONAL</Text>
      </Text>
      <TextInput
        style={styles.notes}
        defaultValue={
          isKitchen ? 'Tap is leaking slowly beneath the sink.' : undefined
        }
        placeholder="Describe damage, wear, or anything the office should know…"
        placeholderTextColor={colors.muted}
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.label}>
        Photo evidence <Text style={styles.optional}>OPTIONAL</Text>
      </Text>
      {photo?.uri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          <View style={styles.previewFooter}>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>Photo ready</Text>
              <Text style={styles.photoHelp} numberOfLines={1}>
                {photo.fileName ?? 'Room evidence'} · Saved on this device
              </Text>
            </View>
            <Pressable onPress={showPhotoOptions} hitSlop={8}>
              <Text style={styles.photoAction}>Replace</Text>
            </Pressable>
            <Pressable onPress={() => setPhoto(undefined)} hitSlop={8}>
              <Text style={styles.removeAction}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.photoBox} onPress={showPhotoOptions}>
          <View style={styles.camera}>
            <Text style={styles.cameraText}>＋</Text>
          </View>
          <Text style={styles.photoTitle}>Take or choose a photo</Text>
          <Text style={styles.photoHelp}>
            One photo per room · 5 MB maximum
          </Text>
        </Pressable>
      )}
      <PrimaryButton label="Save room" onPress={() => navigation.goBack()} />
      <Text style={styles.saved}>
        Changes save automatically on this device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: 40 },
  eyebrow: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 4,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  conditions: { gap: 10, marginBottom: spacing.xl },
  condition: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
  },
  conditionSelected: { borderColor: colors.amber, borderWidth: 2 },
  conditionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionIconText: { fontSize: 18, fontWeight: '900' },
  conditionCopy: { flex: 1, marginLeft: 12 },
  conditionLabel: { fontSize: 15, color: colors.ink, fontWeight: '800' },
  conditionHelp: { fontSize: 11, color: colors.muted, marginTop: 4 },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.amber },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.amber,
  },
  label: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '800',
    marginBottom: 9,
  },
  optional: { fontSize: 9, color: colors.muted, letterSpacing: 0.8 },
  notes: {
    minHeight: 115,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  photoBox: {
    height: 138,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BFC8C2',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  camera: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: { color: colors.primary, fontSize: 22, fontWeight: '500' },
  photoTitle: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '800',
    marginTop: 8,
  },
  photoHelp: { fontSize: 11, color: colors.muted, marginTop: 3 },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  preview: { width: '100%', height: 210, backgroundColor: colors.slateSoft },
  previewFooter: {
    minHeight: 66,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewCopy: { flex: 1 },
  previewTitle: { fontSize: 13, color: colors.ink, fontWeight: '800' },
  photoAction: { fontSize: 12, color: colors.primary, fontWeight: '800' },
  removeAction: { fontSize: 12, color: colors.red, fontWeight: '800' },
  saved: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 10,
  },
});

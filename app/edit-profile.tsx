import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PersonalDataForm } from './(tabs)/profile';
import { colors } from '../src/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <PersonalDataForm onCancel={() => router.back()} />
    </SafeAreaView>
  );
}

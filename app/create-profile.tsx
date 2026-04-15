import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../src/theme';
import { useAuth } from '../src/context/AuthContext';
import { saveUserProfile } from '../src/services/api';
import CustomButton from '../src/components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';

// Valores alineados con ENUMs MySQL y con la edición de perfil (profile.tsx)
type Gender = 'hombre' | 'mujer' | 'otro' | 'prefiero no decir';
type TrainingFrequency = '1-2' | '3-4' | '5+' | 'ocasional';
type PrimaryGoal =
  | 'mejor rendimiento'
  | 'perder peso'
  | 'ganar musculo'
  | 'resistencia'
  | 'recuperacion'
  | 'por salud';
type ActivityLevel = 'sedentario' | 'moderado' | 'activo' | 'muy activo';
type SweatLevel = 'bajo' | 'medio' | 'alto';
type CaffeineTolerance = 'no' | 'bajo' | 'medio' | 'alto';

const OPTION_SETS: Record<string, { value: string; label: string }[]> = {
  gender: [
    { value: 'hombre', label: 'Masculino' },
    { value: 'mujer', label: 'Femenino' },
    { value: 'otro', label: 'Otro' },
    { value: 'prefiero no decir', label: 'Prefiero no decir' },
  ],
  activity_level: [
    { value: 'sedentario', label: 'Sedentario' },
    { value: 'moderado', label: 'Moderado (1-3 días/sem)' },
    { value: 'activo', label: 'Activo (3-5 días/sem)' },
    { value: 'muy activo', label: 'Muy activo (6-7 días/sem)' },
  ],
  training_frequency: [
    { value: '1-2', label: '1-2 veces/sem' },
    { value: '3-4', label: '3-4 veces/sem' },
    { value: '5+', label: '5+ veces/sem' },
    { value: 'ocasional', label: 'Ocasional' },
  ],
  primary_goal: [
    { value: 'ganar musculo', label: 'Ganar músculo' },
    { value: 'perder peso', label: 'Perder peso' },
    { value: 'mejor rendimiento', label: 'Rendimiento' },
    { value: 'resistencia', label: 'Resistencia' },
    { value: 'recuperacion', label: 'Recuperación' },
    { value: 'por salud', label: 'Salud general' },
  ],
  sweat_level: [
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'alto', label: 'Alto' },
  ],
  caffeine_tolerance: [
    { value: 'no', label: 'No consumo' },
    { value: 'bajo', label: 'Baja' },
    { value: 'medio', label: 'Media' },
    { value: 'alto', label: 'Alta' },
  ],
  dietary_restrictions: [
    { value: 'no', label: 'Ninguna' },
    { value: 'vegetariano', label: 'Vegetariano' },
    { value: 'vegano', label: 'Vegano' },
    { value: 'libre de gluten', label: 'Sin gluten' },
    { value: 'libre de lactosa', label: 'Sin lactosa' },
    { value: 'libre de frutos secos', label: 'Sin frutos secos' },
  ],
};

interface ProfileData {
  age: string;
  weight: string;
  height: string;
  gender: Gender;
  training_frequency: TrainingFrequency;
  primary_goal: PrimaryGoal;
  activity_level: ActivityLevel;
  sweat_level: SweatLevel;
  caffeine_tolerance: CaffeineTolerance;
  dietary_restrictions: string;
  allergies: string[];
  preferred_supplements: string[];
}

const TOTAL_STEPS = 4;

type ModalField =
  | 'age'
  | 'weight'
  | 'height'
  | 'gender'
  | 'activity_level'
  | 'training_frequency'
  | 'primary_goal'
  | 'sweat_level'
  | 'caffeine_tolerance'
  | 'dietary_restrictions';

const NUMBER_FIELDS: ModalField[] = ['age', 'weight', 'height'];

const getOptionLabel = (field: string, value: string): string => {
  const opts = OPTION_SETS[field];
  return opts?.find((o) => o.value === value)?.label || value;
};

const CreateProfileScreen = () => {
  const { user, setHasProfile } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);

  const [profileData, setProfileData] = useState<ProfileData>({
    age: '25',
    weight: '70',
    height: '170',
    gender: 'hombre',
    training_frequency: '3-4',
    primary_goal: 'ganar musculo',
    activity_level: 'moderado',
    sweat_level: 'medio',
    caffeine_tolerance: 'medio',
    dietary_restrictions: 'no',
    allergies: [],
    preferred_supplements: [],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalField, setModalField] = useState<ModalField | null>(null);

  const openModal = (field: ModalField) => {
    setModalField(field);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalField(null);
  };

  const handleChange = (field: keyof ProfileData, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear un perfil');
      return;
    }

    try {
      const profileToSave = {
        ...profileData,
        age: parseInt(profileData.age),
        weight: parseInt(profileData.weight),
        height: parseInt(profileData.height),
        dietary_restrictions: [profileData.dietary_restrictions || 'no'],
        allergies: profileData.allergies.length > 0 ? profileData.allergies : [''],
        preferred_supplements:
          profileData.preferred_supplements.length > 0 ? profileData.preferred_supplements : [''],
      };

      const response = await saveUserProfile(user.id, profileToSave);

      if (response.success) {
        setHasProfile(true);
        setTimeout(() => {
          Alert.alert(
            'Perfil Guardado',
            '¡Perfil creado! Las recomendaciones de suplementos se generan para cada sesión de entrenamiento que registres.',
            [
              {
                text: 'Registrar mi primera sesión',
                onPress: () => router.replace('/(tabs)/training'),
              },
            ]
          );
        }, 100);
      } else {
        Alert.alert('Error', response.message || 'No se pudo guardar el perfil');
      }
    } catch (error: any) {
      console.error('Error al guardar el perfil:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Ocurrió un error al guardar tu perfil'
      );
    }
  };

  const renderHeader = () => {
    if (currentStep === 0) return null;
    return (
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderProgressZone = () => {
    if (currentStep === 0) return null;
    return (
      <View style={styles.progressZone}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(currentStep / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderTappableOption = (
    field: ModalField,
    label: string,
    value: string
  ) => (
    <TouchableOpacity
      style={styles.tappableFieldFull}
      onPress={() => openModal(field)}
      activeOpacity={0.7}
    >
      <View>
        <Text style={styles.tappableValueFull}>{getOptionLabel(field, value)}</Text>
        <Text style={styles.tappableLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-down" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  const renderStepBanner = (
    iconName: keyof typeof Ionicons.glyphMap,
    title: string,
    motivationText: string
  ) => (
    <View style={styles.stepBanner}>
      <View style={styles.stepIcon}>
        <Ionicons name={iconName} size={40} color={colors.primary} />
      </View>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.motivationText}>{motivationText}</Text>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.contentBlock}>
              <View style={styles.stepBanner}>
                <View style={styles.stepIcon}>
                  <Ionicons name="fitness-outline" size={40} color={colors.primary} />
                </View>
                <Text style={styles.title}>¡Bienvenido!</Text>
                <Text style={styles.subtitle}>
                  Vamos a crear tu perfil en pocos pasos. Tu esfuerzo es real. Nuestra guía también.
                </Text>
              </View>
              <View style={styles.buttonZone}>
                <CustomButton
                  title="COMENZAR"
                  onPress={handleNext}
                  style={styles.button}
                  iconName="arrow-forward-outline"
                  iconPosition="right"
                  iconSize={24}
                  iconColor={colors.textOnPrimary}
                />
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.contentBlock}>
              {renderStepBanner(
                'body-outline',
                'Datos físicos',
                'Cada dato que ingresas es un paso hacia tu mejor versión.'
              )}
              <View style={styles.inputsZone}>
                <View style={styles.tappableRow}>
                  <TouchableOpacity
                    style={styles.tappableField}
                    onPress={() => openModal('age')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tappableValue}>{profileData.age || '25'}</Text>
                    <Text style={styles.tappableLabel}>Edad (años)</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tappableField}
                    onPress={() => openModal('weight')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tappableValue}>{profileData.weight || '70'}</Text>
                    <Text style={styles.tappableLabel}>Peso (kg)</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tappableField}
                    onPress={() => openModal('height')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tappableValue}>{profileData.height || '170'}</Text>
                    <Text style={styles.tappableLabel}>Altura (cm)</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {renderTappableOption('gender', 'Género', profileData.gender)}
              </View>
              <View style={styles.buttonZone}>
                <CustomButton
                  title="SIGUIENTE"
                  onPress={handleNext}
                  style={styles.button}
                  iconName="arrow-forward-outline"
                  iconPosition="right"
                  iconSize={24}
                  iconColor={colors.textOnPrimary}
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.contentBlock}>
              {renderStepBanner(
                'barbell-outline',
                'Nivel de actividad',
                'Lo importante no es de dónde partes, sino a dónde vas.'
              )}
              <View style={styles.inputsZone}>
                {renderTappableOption(
                  'activity_level',
                  '¿Qué tan activo eres?',
                  profileData.activity_level
                )}
                {renderTappableOption(
                  'training_frequency',
                  '¿Con qué frecuencia entrenas?',
                  profileData.training_frequency
                )}
              </View>
              <View style={styles.buttonZone}>
                <CustomButton
                  title="SIGUIENTE"
                  onPress={handleNext}
                  style={styles.button}
                  iconName="arrow-forward-outline"
                  iconPosition="right"
                  iconSize={24}
                  iconColor={colors.textOnPrimary}
                />
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.contentBlock}>
              {renderStepBanner(
                'trophy-outline',
                'Objetivo y sudoración',
                'Un objetivo claro es el motor de un cambio real.'
              )}
              <View style={styles.inputsZone}>
                {renderTappableOption(
                  'primary_goal',
                  '¿Cuál es tu objetivo principal?',
                  profileData.primary_goal
                )}
                {renderTappableOption(
                  'sweat_level',
                  '¿Qué tanto sudas durante el ejercicio?',
                  profileData.sweat_level
                )}
              </View>
              <View style={styles.buttonZone}>
                <CustomButton
                  title="SIGUIENTE"
                  onPress={handleNext}
                  style={styles.button}
                  iconName="arrow-forward-outline"
                  iconPosition="right"
                  iconSize={24}
                  iconColor={colors.textOnPrimary}
                />
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.contentBlock}>
              {renderStepBanner(
                'nutrition-outline',
                'Preferencias nutricionales',
                'Conociendo tu cuerpo, maximizamos tus resultados.'
              )}
              <View style={styles.inputsZone}>
                {renderTappableOption(
                  'caffeine_tolerance',
                  '¿Cómo es tu tolerancia a la cafeína?',
                  profileData.caffeine_tolerance
                )}
                {renderTappableOption(
                  'dietary_restrictions',
                  '¿Tienes restricciones alimenticias?',
                  profileData.dietary_restrictions
                )}
                <Text style={styles.subtitleCompact}>
                  Ya tenemos tu perfil. Empieza tu camino hacia una versión más fuerte y sana.
                </Text>
              </View>
              <View style={styles.buttonZone}>
                <CustomButton
                  title="GUARDAR PERFIL"
                  iconName="save-outline"
                  iconPosition="right"
                  iconSize={24}
                  iconColor={colors.textOnPrimary}
                  onPress={handleSaveProfile}
                  style={styles.button}
                />
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {renderHeader()}
        <View style={styles.content}>{renderStepContent()}</View>
      </View>
      {renderProgressZone()}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalField === 'age' && 'Selecciona tu edad'}
              {modalField === 'weight' && 'Selecciona tu peso'}
              {modalField === 'height' && 'Selecciona tu altura'}
              {modalField === 'gender' && 'Selecciona tu género'}
              {modalField === 'activity_level' && '¿Qué tan activo eres?'}
              {modalField === 'training_frequency' && '¿Con qué frecuencia entrenas?'}
              {modalField === 'primary_goal' && '¿Cuál es tu objetivo principal?'}
              {modalField === 'sweat_level' && '¿Qué tanto sudas durante el ejercicio?'}
              {modalField === 'caffeine_tolerance' && '¿Cómo es tu tolerancia a la cafeína?'}
              {modalField === 'dietary_restrictions' && '¿Tienes restricciones alimenticias?'}
            </Text>
            {modalField === 'age' && (
              <Picker
                selectedValue={profileData.age || '25'}
                onValueChange={(v) => handleChange('age', v)}
                style={styles.modalPicker}
                itemStyle={styles.pickerItem}
                dropdownIconColor={colors.primary}
              >
                {Array.from({ length: 109 }, (_, i) => i + 12).map((age) => (
                  <Picker.Item key={age} label={`${age} años`} value={age.toString()} color={colors.textPrimary} />
                ))}
              </Picker>
            )}
            {modalField === 'weight' && (
              <Picker
                selectedValue={profileData.weight || '70'}
                onValueChange={(v) => handleChange('weight', v)}
                style={styles.modalPicker}
                itemStyle={styles.pickerItem}
                dropdownIconColor={colors.primary}
              >
                {Array.from({ length: 171 }, (_, i) => i + 30).map((w) => (
                  <Picker.Item key={w} label={`${w} kg`} value={w.toString()} color={colors.textPrimary} />
                ))}
              </Picker>
            )}
            {modalField === 'height' && (
              <Picker
                selectedValue={profileData.height || '170'}
                onValueChange={(v) => handleChange('height', v)}
                style={styles.modalPicker}
                itemStyle={styles.pickerItem}
                dropdownIconColor={colors.primary}
              >
                {Array.from({ length: 101 }, (_, i) => i + 130).map((h) => (
                  <Picker.Item key={h} label={`${h} cm`} value={h.toString()} color={colors.textPrimary} />
                ))}
              </Picker>
            )}
            {modalField &&
              !NUMBER_FIELDS.includes(modalField) &&
              OPTION_SETS[modalField] && (
                <Picker
                  selectedValue={
                    profileData[modalField as keyof ProfileData] as string
                  }
                  onValueChange={(v) =>
                    handleChange(modalField as keyof ProfileData, v)
                  }
                  style={styles.modalPicker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor={colors.primary}
                >
                  {OPTION_SETS[modalField].map((opt) => (
                    <Picker.Item
                      key={opt.value}
                      label={opt.label}
                      value={opt.value}
                      color={colors.textPrimary}
                    />
                  ))}
                </Picker>
              )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeModal}
            >
              <Text style={styles.modalButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingTop: 8,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
  },
  backButton: {
    padding: 8,
  },
  progressZone: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBlock: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 24,
  },
  stepBanner: {
    alignItems: 'center',
    paddingTop: 8,
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputsZone: {
    width: '100%',
    paddingVertical: 4,
  },
  buttonZone: {
    width: '100%',
    marginTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 14,
    color: colors.textPrimary,
    opacity: 0.9,
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    opacity: 0.88,
    marginTop: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  tappableRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  tappableField: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tappableValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  tappableLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 4,
  },
  tappableFieldFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  tappableValueFull: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalPicker: {
    width: '100%',
    color: colors.textPrimary,
    marginBottom: 16,
    backgroundColor: Platform.OS === 'android' ? colors.surface : 'transparent',
  },
  pickerItem: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    marginTop: 12,
    marginBottom: 8,
  },
});

export default CreateProfileScreen;

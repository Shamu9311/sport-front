import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  Platform,
  Dimensions,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../src/components/CustomButton';
import {
  saveUserProfile,
  getProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import NotificationService from '../../src/services/notificationService';
import { colors } from '../../src/theme';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import SelectField from '../../src/components/SelectField';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Tipos (sin cambios)
type Gender = 'hombre' | 'mujer' | 'otro' | 'prefiero no decir';
type ActivityLevel = 'sedentario' | 'moderado' | 'activo' | 'muy activo';
type TrainingFrequency = '1-2' | '3-4' | '5+' | 'ocasional';
type PrimaryGoal =
  | 'mejor rendimiento'
  | 'perder peso'
  | 'ganar musculo'
  | 'resistencia'
  | 'recuperacion'
  | 'por salud';
type SweatLevel = 'bajo' | 'medio' | 'alto';
type CaffeineTolerance = 'no' | 'bajo' | 'medio' | 'alto';
type DietaryRestriction =
  | 'vegetariano'
  | 'vegano'
  | 'libre de gluten'
  | 'libre de lactosa'
  | 'libre de frutos secos'
  | 'no';

// 1. Cambia dietary_restrictions a string simple
interface UserProfileData {
  age: number | string; // Permitir string temporalmente por el input
  weight: number | string; // Permitir string temporalmente
  height: number | string; // Permitir string temporalmente
  gender: Gender;
  activity_level: ActivityLevel;
  training_frequency: TrainingFrequency;
  primary_goal: PrimaryGoal;
  sweat_level: SweatLevel;
  caffeine_tolerance: CaffeineTolerance;
  dietary_restrictions: DietaryRestriction; // <-- AHORA ES UNA SOLA STRING
}

// Interfaz para la información del usuario
interface UserInfo {
  id: number;
  username: string;
  email: string;
  created_at: string;
  profile?: UserProfileData;
}

// Componente principal de perfil
const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Estados para notificaciones
  const [consumptionReminders, setConsumptionReminders] = useState(true);
  const [trainingAlerts, setTrainingAlerts] = useState(true);
  const [preferredTime, setPreferredTime] = useState('09:00');
  
  // Ref para evitar cargas innecesarias
  const isLoadedRef = useRef(false);
  const lastUserIdRef = useRef<number | null>(null);

  // Función para cargar la información del usuario
  const loadUserProfile = async () => {
    if (!user?.id) {
      setError('No hay usuario autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileResponse, notifPrefs] = await Promise.all([
        getProfile(user.id),
        getNotificationPreferences(user.id).catch(() => ({ data: null })),
      ]);

      if (profileResponse.success && profileResponse.data) {
        // Extract the user info from the response structure
        setUserInfo({
          id: user.id,
          username: profileResponse.data.user?.username || user.username || 'Usuario',
          email: profileResponse.data.user?.email || user.email || 'No disponible',
          created_at: profileResponse.data.user?.created_at || new Date().toISOString(),
          profile: profileResponse.data.profile || undefined,
        });
      } else {
        // Si no hay perfil o hubo un error, al menos mostrar la info básica del usuario
        setUserInfo({
          id: user.id,
          username: user.username || 'Usuario',
          email: user.email || 'No disponible',
          created_at: user.created_at || new Date().toISOString(),
        });

      }

      // Cargar preferencias de notificaciones
      if (notifPrefs?.data) {
        const consumptionValue =
          notifPrefs.data.consumption_reminders === true ||
          notifPrefs.data.consumption_reminders === 1;
        const trainingValue =
          notifPrefs.data.training_alerts === true || notifPrefs.data.training_alerts === 1;

        setConsumptionReminders(consumptionValue);
        setTrainingAlerts(trainingValue);
        setPreferredTime(notifPrefs.data.preferred_time?.substring(0, 5) ?? '09:00');
      }
      isLoadedRef.current = true;
    } catch (err: any) {
      console.error('Error al cargar perfil:', err);
      setError(err.message || 'Error al cargar la información del perfil');
      isLoadedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar perfil cuando se enfoca la pantalla (solo si no está cargado o cambió el usuario)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        if (!isLoadedRef.current || lastUserIdRef.current !== user.id) {
          lastUserIdRef.current = user.id;
          loadUserProfile();
        }
      }
      return () => {};
    }, [user?.id])
  );
  
  // Resetear flag cuando se edita el perfil
  const forceReload = useCallback(() => {
    isLoadedRef.current = false;
    loadUserProfile();
  }, [user?.id]);

  // Manejar cierre de sesión
  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, cerrar sesión',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  // Manejadores de notificaciones
  const handleToggleConsumptionReminders = async (value: boolean) => {
    if (value) {
      // Solicitar permisos antes de activar
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permisos de notificaciones',
          'Para recibir recordatorios, debes permitir las notificaciones en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configuración',
              onPress: () => openAppSettings(),
            },
          ]
        );
        return;
      }
    }

    setConsumptionReminders(value);
    await updateNotificationPrefs(value, trainingAlerts, preferredTime);
  };

  const handleToggleTrainingAlerts = async (value: boolean) => {
    if (value) {
      // Solicitar permisos antes de activar
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permisos de notificaciones',
          'Para recibir alertas de entrenamiento, debes permitir las notificaciones en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configuración',
              onPress: () => openAppSettings(),
            },
          ]
        );
        return;
      }

      // Programar alerta de entrenamiento
      await NotificationService.scheduleTrainingAlert(preferredTime);
    } else {
      // Cancelar notificaciones
      await NotificationService.cancelAllNotifications();
    }

    setTrainingAlerts(value);
    await updateNotificationPrefs(consumptionReminders, value, preferredTime);
  };

  const openAppSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        // Android - abrir configuración de la app
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error abriendo configuración:', error);
      Alert.alert('Error', 'No se pudo abrir la configuración');
    }
  };

  const updateNotificationPrefs = async (consumption: boolean, training: boolean, time: string) => {
    if (!user?.id) return;

    try {
      const response = await updateNotificationPreferences(user.id, {
        consumption_reminders: consumption,
        training_alerts: training,
        preferred_time: time + ':00',
      });
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      Alert.alert('Error', 'No se pudieron guardar las preferencias de notificaciones');
      // Revertir el cambio en caso de error
      await loadUserProfile();
    }
  };

  // Manejar cierre de aplicación
  // const handleExitApp = () => {
  //   Alert.alert('Cerrar Aplicación', '¿Estás seguro que deseas salir de la aplicación?', [
  //     { text: 'Cancelar', style: 'cancel' },
  //     {
  //       text: 'Sí, salir',
  //       onPress: () => {
  //         if (Platform.OS === 'android') {
  //           BackHandler.exitApp();
  //         }
  //       },
  //     },
  //   ]);
  // };

  // Mostrar formulario de edición
  const handleEditProfile = () => {
    setShowEditForm(true);
  };

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <View style={styles.profileLoadingRoot}>
        <SkeletonLoader type='profileCard' />
      </View>
    );
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name='alert-circle' size={60} color={colors.error} style={{ marginBottom: 20 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadUserProfile}>
          <Ionicons name='refresh' size={20} color={colors.textOnPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.refreshButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si se muestra el formulario de edición, renderizar el formulario
  if (showEditForm) {
    return (
      <PersonalDataForm
        onCancel={() => {
          setShowEditForm(false);
          loadUserProfile(); // Recargar datos después de cerrar el formulario
        }}
        currentProfile={userInfo?.profile}
      />
    );
  }

  // Renderizar la información del perfil
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con Avatar */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name='person-circle' size={100} color={colors.primary} />
        </View>
        <Text style={styles.profileTitle}>{userInfo?.username || 'Usuario'}</Text>
        <Text style={styles.profileEmail}>{userInfo?.email || 'No disponible'}</Text>
      </View>

      {/* Card de Información Personal y Datos Físicos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name='person' size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>Información Personal</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name='calendar' size={18} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Miembro desde</Text>
          </View>
          <Text style={styles.infoValue}>
            {userInfo?.created_at
              ? new Date(userInfo.created_at).toLocaleDateString('es-ES')
              : 'N/A'}
          </Text>
        </View>

        {/* Datos Físicos dentro de la misma card */}
        {userInfo?.profile && (
          <>
            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name='calendar-outline' size={24} color={colors.primary} />
                <Text style={styles.statValue}>{userInfo.profile.age}</Text>
                <Text style={styles.statLabel}>Años</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name='scale-outline' size={24} color={colors.primary} />
                <Text style={styles.statValue}>{userInfo.profile.weight}</Text>
                <Text style={styles.statLabel}>kg</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name='resize-outline' size={24} color={colors.primary} />
                <Text style={styles.statValue}>{userInfo.profile.height}</Text>
                <Text style={styles.statLabel}>cm</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='male-female' size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Género</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.gender}</Text>
            </View>
          </>
        )}
      </View>

      {/* Card de Actividad Deportiva */}
      {userInfo?.profile ? (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name='barbell' size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Actividad Deportiva</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='trending-up' size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Nivel de actividad</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.activity_level}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='repeat' size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Frecuencia</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.training_frequency} veces/sem</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='trophy' size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Objetivo</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.primary_goal}</Text>
            </View>
          </View>

          {/* Card de Preferencias */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name='settings' size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Preferencias</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='water' size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Sudoración</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.sweat_level}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='cafe' size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Tolerancia cafeína</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.caffeine_tolerance}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='restaurant' size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Restricciones</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.dietary_restrictions}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons
            name='information-circle-outline'
            size={60}
            color={colors.textSecondary}
            style={{ marginBottom: 15 }}
          />
          <Text style={styles.noProfileText}>No has completado tu perfil deportivo</Text>
          <Text style={styles.noProfileSubtext}>
            Completa tu perfil para obtener recomendaciones personalizadas
          </Text>
        </View>
      )}

      {/* Card de Notificaciones */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name='notifications' size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>Notificaciones</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name='time' size={20} color={colors.textSecondary} />
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>Recordatorios de consumo</Text>
              <Text style={styles.switchSubtext}>Notificaciones sobre productos recomendados</Text>
            </View>
          </View>
          <Switch
            value={consumptionReminders}
            onValueChange={handleToggleConsumptionReminders}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={consumptionReminders ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name='barbell' size={20} color={colors.textSecondary} />
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>Alertas de entrenamientos</Text>
              <Text style={styles.switchSubtext}>Recordatorio diario para entrenar</Text>
            </View>
          </View>
          <Switch
            value={trainingAlerts}
            onValueChange={handleToggleTrainingAlerts}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={trainingAlerts ? colors.primary : colors.textSecondary}
          />
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name='create-outline' size={22} color={colors.textOnPrimary} />
          <Text style={styles.buttonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name='log-out-outline' size={22} color={colors.textPrimary} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.exitButton} onPress={handleExitApp}>
          <Ionicons name='exit-outline' size={22} color={colors.textPrimary} />
          <Text style={styles.exitButtonText}>Salir de la Aplicación</Text>
        </TouchableOpacity> */}
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// Componente de formulario de datos personales
const PersonalDataForm = ({
  onCancel,
  currentProfile,
}: {
  onCancel?: () => void;
  currentProfile?: UserProfileData;
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfileData>({
    age: '',
    weight: '',
    height: '',
    gender: 'hombre',
    activity_level: 'moderado',
    training_frequency: '3-4',
    primary_goal: 'mejor rendimiento',
    sweat_level: 'medio',
    caffeine_tolerance: 'medio',
    dietary_restrictions: 'no',
  });
  const [originalData, setOriginalData] = useState<UserProfileData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar datos actuales del usuario al montar el componente
  useEffect(() => {
    const loadCurrentData = async () => {
      try {
        if (currentProfile) {
          // Si se pasa el perfil como prop, usarlo
          const loadedData = {
            age: currentProfile.age?.toString() || '',
            weight: currentProfile.weight?.toString() || '',
            height: currentProfile.height?.toString() || '',
            gender: currentProfile.gender || 'hombre',
            activity_level: currentProfile.activity_level || 'moderado',
            training_frequency: currentProfile.training_frequency || '3-4',
            primary_goal: currentProfile.primary_goal || 'mejor rendimiento',
            sweat_level: currentProfile.sweat_level || 'medio',
            caffeine_tolerance: currentProfile.caffeine_tolerance || 'medio',
            dietary_restrictions: currentProfile.dietary_restrictions || 'no',
          };
          setUserData(loadedData);
          setOriginalData(loadedData); // Guardar datos originales para comparar
        } else if (user?.id) {
          // Si no se pasa como prop, cargar desde la API
          const response = await getProfile(user.id);
          if (response.success && response.data?.profile) {
            const profile = response.data.profile;
            const loadedData = {
              age: profile.age?.toString() || '',
              weight: profile.weight?.toString() || '',
              height: profile.height?.toString() || '',
              gender: profile.gender || 'hombre',
              activity_level: profile.activity_level || 'moderado',
              training_frequency: profile.training_frequency || '3-4',
              primary_goal: profile.primary_goal || 'mejor rendimiento',
              sweat_level: profile.sweat_level || 'medio',
              caffeine_tolerance: profile.caffeine_tolerance || 'medio',
              dietary_restrictions: profile.dietary_restrictions || 'no',
            };
            setUserData(loadedData);
            setOriginalData(loadedData); // Guardar datos originales
          }
        }
      } catch (error) {
        console.error('Error cargando datos del perfil para edición:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentData();
  }, [currentProfile, user]);

  // Detectar si hay cambios en el formulario
  useEffect(() => {
    if (!originalData) {
      setHasChanges(false);
      return;
    }

    // Comparar userData con originalData
    const changed = JSON.stringify(userData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [userData, originalData]);

  // Función para manejar el envío del formulario
  const handleSubmit = async () => {
    // Validación básica
    if (!userData.age || !userData.weight || !userData.height) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    // Convertir strings a números para enviar al backend
    const profileData = {
      ...userData,
      age: Number(userData.age),
      weight: Number(userData.weight),
      height: Number(userData.height),
    };

    try {
      if (!user?.id) {
        Alert.alert('Error', 'No se pudo identificar al usuario');
        return;
      }

      // Llamar a la API para guardar el perfil
      await saveUserProfile(user.id, profileData as any);

      if (onCancel) onCancel();

      Toast.show({
        type: 'success',
        text1: 'Perfil actualizado',
        text2: 'Los cambios se guardaron correctamente.',
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMsg =
        error?.response?.data?.message || error?.message || 'No se pudo guardar el perfil.';
      Alert.alert('Error', errorMsg);
    }
  };

  // Función para manejar cambio en TextInput numéricos
  const handleNumericChange = (field: keyof UserProfileData, text: string) => {
    // Permite solo números y un punto decimal (ajusta según necesites)
    const numericValue = text.replace(/[^0-9.]/g, '');
    setUserData({ ...userData, [field]: numericValue });
  };

  // Mostrar loading mientras carga los datos
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={styles.loadingText}>Cargando datos del perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
    >
      {/* Header con título y botón de regresar */}
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={onCancel} style={styles.backButtonEdit}>
          <Ionicons name='arrow-back' size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.editHeaderTitle}>Editar Perfil</Text>
      </View>

      {/* Contenido del formulario */}
      <View style={styles.formContainer}>
        {/* Datos Básicos Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='person-outline' size={20} color={colors.primary} />
            <Text style={styles.formCardTitle}>Datos Básicos</Text>
          </View>

          <Text style={styles.label}>Edad</Text>
          <TextInput
            style={styles.input}
            keyboardType='numeric'
            placeholder='Ej: 25'
            placeholderTextColor={colors.textMuted}
            value={String(userData.age)}
            onChangeText={(text) => handleNumericChange('age', text)}
          />

          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType='numeric'
            placeholder='Ej: 70.5'
            placeholderTextColor={colors.textMuted}
            value={String(userData.weight)}
            onChangeText={(text) => handleNumericChange('weight', text)}
          />

          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType='numeric'
            placeholder='Ej: 175'
            placeholderTextColor={colors.textMuted}
            value={String(userData.height)}
            onChangeText={(text) => handleNumericChange('height', text)}
          />
        </View>

        {/* Género y Características Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='body-outline' size={20} color={colors.primary} />
            <Text style={styles.formCardTitle}>Características Personales</Text>
          </View>

          <SelectField<Gender>
            label='Género'
            value={userData.gender}
            options={[
              { label: 'Hombre', value: 'hombre' },
              { label: 'Mujer', value: 'mujer' },
              { label: 'Otro', value: 'otro' },
              { label: 'Prefiero no decir', value: 'prefiero no decir' },
            ]}
            onValueChange={(value) => setUserData({ ...userData, gender: value })}
          />
        </View>

        {/* Actividad Deportiva Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='barbell-outline' size={20} color={colors.primary} />
            <Text style={styles.formCardTitle}>Actividad Deportiva</Text>
          </View>

          <SelectField<ActivityLevel>
            label='Nivel de actividad'
            value={userData.activity_level}
            options={[
              { label: 'Sedentario', value: 'sedentario' },
              { label: 'Moderado', value: 'moderado' },
              { label: 'Activo', value: 'activo' },
              { label: 'Muy activo', value: 'muy activo' },
            ]}
            onValueChange={(value) => setUserData({ ...userData, activity_level: value })}
          />

          <SelectField<TrainingFrequency>
            label='Frecuencia de entrenamiento'
            value={userData.training_frequency}
            options={[
              { label: '1-2 veces por semana', value: '1-2' },
              { label: '3-4 veces por semana', value: '3-4' },
              { label: '5+ veces por semana', value: '5+' },
              { label: 'Ocasional', value: 'ocasional' },
            ]}
            onValueChange={(value) => setUserData({ ...userData, training_frequency: value })}
          />

          <SelectField<PrimaryGoal>
            label='Objetivo principal'
            value={userData.primary_goal}
            options={[
              { label: 'Mejor rendimiento', value: 'mejor rendimiento' },
              { label: 'Perder peso', value: 'perder peso' },
              { label: 'Ganar músculo', value: 'ganar musculo' },
              { label: 'Resistencia', value: 'resistencia' },
              { label: 'Recuperación', value: 'recuperacion' },
              { label: 'Por salud', value: 'por salud' },
            ]}
            onValueChange={(value) => setUserData({ ...userData, primary_goal: value })}
          />
        </View>

        {/* Preferencias Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='settings-outline' size={20} color={colors.primary} />
            <Text style={styles.formCardTitle}>Preferencias</Text>
          </View>

          <SelectField<SweatLevel>
            label='Nivel de sudoración'
            value={userData.sweat_level}
            options={[
              { label: 'Bajo', value: 'bajo' },
              { label: 'Medio', value: 'medio' },
              { label: 'Alto', value: 'alto' },
            ]}
            onValueChange={(value) => setUserData({ ...userData, sweat_level: value })}
          />

          <SelectField<CaffeineTolerance>
            label='Tolerancia a la cafeína'
            value={userData.caffeine_tolerance}
            options={[
              { label: 'No consumo', value: 'no' },
              { label: 'Baja', value: 'bajo' },
              { label: 'Media', value: 'medio' },
              { label: 'Alta', value: 'alto' },
            ]}
            onValueChange={(value) => setUserData({ ...userData, caffeine_tolerance: value })}
          />

          <SelectField<DietaryRestriction>
            label='Restricción dietética principal'
            value={userData.dietary_restrictions}
            options={[
              { label: 'Ninguna', value: 'no' },
              { label: 'Vegetariano', value: 'vegetariano' },
              { label: 'Vegano', value: 'vegano' },
              { label: 'Libre de gluten', value: 'libre de gluten' },
              { label: 'Libre de lactosa', value: 'libre de lactosa' },
              { label: 'Libre de frutos secos', value: 'libre de frutos secos' },
            ]}
            onValueChange={(value) => setUserData({ ...userData, dietary_restrictions: value })}
          />
        </View>

        {/* Botones centrados */}
        <View style={styles.formButtonsContainer}>
          <CustomButton
            title={hasChanges ? 'GUARDAR CAMBIOS' : 'SIN CAMBIOS'}
            onPress={hasChanges ? handleSubmit : () => {}}
            iconName={hasChanges ? 'save-outline' : 'checkmark-circle-outline'}
            iconPosition='right'
            iconColor={colors.textOnPrimary}
            iconSize={24}
            style={[styles.button, !hasChanges && styles.buttonDisabled]}
          />

          <CustomButton
            title='CERRAR SESIÓN'
            onPress={() => {
              Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sí, cerrar sesión',
                  onPress: async () => {
                    await logout();
                    router.replace('/login');
                  },
                },
              ]);
            }}
            iconName='log-out-outline'
            iconPosition='right'
            iconColor={colors.textOnPrimary}
            iconSize={20}
            style={styles.logoutButton}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 30,
  },
  profileLoadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },

  profileHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  profileTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 12,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    borderRadius: 12,
    minWidth: '28%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    color: colors.textPrimary,
    opacity: 0.85,
    fontSize: 15,
    marginLeft: 10,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noProfileText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  noProfileSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  logoutButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  exitButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  exitButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },

  editHeader: {
    backgroundColor: colors.surface,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  backButtonEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  formContainer: {
    padding: 16,
  },
  formButtonsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  formCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.textPrimary,
    opacity: 0.85,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default ProfileScreen;

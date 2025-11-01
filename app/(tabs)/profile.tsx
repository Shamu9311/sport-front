import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../src/components/CustomButton';
import { saveUserProfile, getProfile } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

// Tipos (sin cambios)
type Gender = 'hombre' | 'mujer' | 'otro' | 'prefiero no decir';
type ActivityLevel = 'sedentario' | 'moderado' | 'activo' | 'muy activo';
type TrainingFrequency = '1-2' | '3-4' | '5+' | 'ocacional';
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

  // Función para cargar la información del usuario
  const loadUserProfile = async () => {
    if (!user?.id) {
      setError('No hay usuario autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileResponse = await getProfile(user.id);

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

        if (profileResponse.message) {
          console.log('Mensaje del servidor:', profileResponse.message);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar perfil:', err);
      setError(err.message || 'Error al cargar la información del perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cargar perfil cuando se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      return () => {};
    }, [user?.id])
  );

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
      <View style={styles.centeredContainer}>
        <ActivityIndicator size='large' color='#D4AF37' />
        <Text style={styles.loadingText}>Cargando información del perfil...</Text>
      </View>
    );
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name='alert-circle' size={60} color='#FF6B6B' style={{ marginBottom: 20 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadUserProfile}>
          <Ionicons name='refresh' size={20} color='#1a1919' style={{ marginRight: 8 }} />
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
          <Ionicons name='person-circle' size={100} color='#D4AF37' />
        </View>
        <Text style={styles.profileTitle}>{userInfo?.username || 'Usuario'}</Text>
        <Text style={styles.profileEmail}>{userInfo?.email || 'No disponible'}</Text>
      </View>

      {/* Card de Información Personal y Datos Físicos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name='person' size={24} color='#D4AF37' />
          <Text style={styles.cardTitle}>Información Personal</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name='calendar' size={18} color='#999' />
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
                <Ionicons name='calendar-outline' size={24} color='#D4AF37' />
                <Text style={styles.statValue}>{userInfo.profile.age}</Text>
                <Text style={styles.statLabel}>Años</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name='scale-outline' size={24} color='#D4AF37' />
                <Text style={styles.statValue}>{userInfo.profile.weight}</Text>
                <Text style={styles.statLabel}>kg</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name='resize-outline' size={24} color='#D4AF37' />
                <Text style={styles.statValue}>{userInfo.profile.height}</Text>
                <Text style={styles.statLabel}>cm</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='male-female' size={18} color='#999' />
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
              <Ionicons name='barbell' size={24} color='#D4AF37' />
              <Text style={styles.cardTitle}>Actividad Deportiva</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='trending-up' size={18} color='#999' />
                <Text style={styles.infoLabel}>Nivel de actividad</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.activity_level}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='repeat' size={18} color='#999' />
                <Text style={styles.infoLabel}>Frecuencia</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.training_frequency} veces/sem</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='trophy' size={18} color='#999' />
                <Text style={styles.infoLabel}>Objetivo</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.primary_goal}</Text>
            </View>
          </View>

          {/* Card de Preferencias */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name='settings' size={24} color='#D4AF37' />
              <Text style={styles.cardTitle}>Preferencias</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='water' size={18} color='#999' />
                <Text style={styles.infoLabel}>Sudoración</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.sweat_level}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='cafe' size={18} color='#999' />
                <Text style={styles.infoLabel}>Tolerancia cafeína</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo.profile.caffeine_tolerance}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name='restaurant' size={18} color='#999' />
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
            color='#999'
            style={{ marginBottom: 15 }}
          />
          <Text style={styles.noProfileText}>No has completado tu perfil deportivo</Text>
          <Text style={styles.noProfileSubtext}>
            Completa tu perfil para obtener recomendaciones personalizadas
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name='create-outline' size={22} color='#1a1919' />
          <Text style={styles.buttonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name='log-out-outline' size={22} color='#fff' />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.exitButton} onPress={handleExitApp}>
          <Ionicons name='exit-outline' size={22} color='#fff' />
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
          console.log('✅ Datos del perfil cargados en el formulario');
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
            console.log('✅ Datos del perfil cargados desde API');
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

      // Cerrar el formulario automáticamente
      if (onCancel) onCancel();

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
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
        <ActivityIndicator size='large' color='#D4AF37' />
        <Text style={styles.loadingText}>Cargando datos del perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#1a1919' }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
    >
      {/* Header con título y botón de regresar */}
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={onCancel} style={styles.backButtonEdit}>
          <Ionicons name='arrow-back' size={24} color='#D4AF37' />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.editHeaderTitle}>Editar Perfil</Text>
      </View>

      {/* Contenido del formulario */}
      <View style={styles.formContainer}>
        {/* Datos Básicos Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='person-outline' size={20} color='#D4AF37' />
            <Text style={styles.formCardTitle}>Datos Básicos</Text>
          </View>

          <Text style={styles.label}>Edad</Text>
          <TextInput
            style={styles.input}
            keyboardType='numeric'
            placeholder='Ej: 25'
            placeholderTextColor='#666'
            value={String(userData.age)}
            onChangeText={(text) => handleNumericChange('age', text)}
          />

          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType='numeric'
            placeholder='Ej: 70.5'
            placeholderTextColor='#666'
            value={String(userData.weight)}
            onChangeText={(text) => handleNumericChange('weight', text)}
          />

          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType='numeric'
            placeholder='Ej: 175'
            placeholderTextColor='#666'
            value={String(userData.height)}
            onChangeText={(text) => handleNumericChange('height', text)}
          />
        </View>

        {/* Género y Características Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='body-outline' size={20} color='#D4AF37' />
            <Text style={styles.formCardTitle}>Características Personales</Text>
          </View>

          <Text style={styles.label}>Género</Text>
          <Picker
            selectedValue={userData.gender}
            onValueChange={(value) => setUserData({ ...userData, gender: value })}
            style={styles.picker}
            dropdownIconColor='#D4AF37'
            mode='dialog'
          >
            <Picker.Item label='Hombre' value='hombre' />
            <Picker.Item label='Mujer' value='mujer' />
            <Picker.Item label='Otro' value='otro' />
            <Picker.Item label='Prefiero no decir' value='prefiero no decir' />
          </Picker>
        </View>

        {/* Actividad Deportiva Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='barbell-outline' size={20} color='#D4AF37' />
            <Text style={styles.formCardTitle}>Actividad Deportiva</Text>
          </View>

          <Text style={styles.label}>Nivel de actividad</Text>
          <Picker
            selectedValue={userData.activity_level}
            onValueChange={(value) => setUserData({ ...userData, activity_level: value })}
            style={styles.picker}
            dropdownIconColor='#D4AF37'
            mode='dialog'
          >
            <Picker.Item label='Sedentario' value='sedentario' />
            <Picker.Item label='Moderado' value='moderado' />
            <Picker.Item label='Activo' value='activo' />
            <Picker.Item label='Muy activo' value='muy activo' />
          </Picker>

          <Text style={styles.label}>Frecuencia de entrenamiento</Text>
          <Picker
            selectedValue={userData.training_frequency}
            onValueChange={(value) => setUserData({ ...userData, training_frequency: value })}
            style={styles.picker}
            dropdownIconColor='#D4AF37'
            mode='dialog'
          >
            <Picker.Item label='1-2 veces por semana' value='1-2' />
            <Picker.Item label='3-4 veces por semana' value='3-4' />
            <Picker.Item label='5+ veces por semana' value='5+' />
            <Picker.Item label='Ocasional' value='ocacional' />
          </Picker>

          <Text style={styles.label}>Objetivo principal</Text>
          <Picker
            selectedValue={userData.primary_goal}
            onValueChange={(value) => setUserData({ ...userData, primary_goal: value })}
            style={styles.picker}
            dropdownIconColor='#D4AF37'
            mode='dialog'
          >
            <Picker.Item label='Mejor rendimiento' value='mejor rendimiento' />
            <Picker.Item label='Perder peso' value='perder peso' />
            <Picker.Item label='Ganar músculo' value='ganar musculo' />
            <Picker.Item label='Resistencia' value='resistencia' />
            <Picker.Item label='Recuperación' value='recuperacion' />
            <Picker.Item label='Por salud' value='por salud' />
          </Picker>
        </View>

        {/* Preferencias Card */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Ionicons name='settings-outline' size={20} color='#D4AF37' />
            <Text style={styles.formCardTitle}>Preferencias</Text>
          </View>

          <Text style={styles.label}>Nivel de sudoración</Text>
          <Picker
            selectedValue={userData.sweat_level}
            onValueChange={(value) => setUserData({ ...userData, sweat_level: value })}
            style={styles.picker}
            dropdownIconColor='#D4AF37'
            mode='dialog'
          >
            <Picker.Item label='Bajo' value='bajo' />
            <Picker.Item label='Medio' value='medio' />
            <Picker.Item label='Alto' value='alto' />
          </Picker>

          <Text style={styles.label}>Tolerancia a la cafeína</Text>
          <Picker
            selectedValue={userData.caffeine_tolerance}
            onValueChange={(value) => setUserData({ ...userData, caffeine_tolerance: value })}
            style={styles.picker}
            dropdownIconColor='#D4AF37'
            mode='dialog'
          >
            <Picker.Item label='No consumo' value='no' />
            <Picker.Item label='Baja' value='bajo' />
            <Picker.Item label='Media' value='medio' />
            <Picker.Item label='Alta' value='alto' />
          </Picker>

          <Text style={styles.label}>Restricción dietética principal</Text>
          <Picker
            selectedValue={userData.dietary_restrictions}
            onValueChange={(value) => setUserData({ ...userData, dietary_restrictions: value })}
            style={styles.picker}
            dropdownIconColor='#D4AF37'
            mode='dialog'
          >
            <Picker.Item label='Ninguna' value='no' />
            <Picker.Item label='Vegetariano' value='vegetariano' />
            <Picker.Item label='Vegano' value='vegano' />
            <Picker.Item label='Libre de gluten' value='libre de gluten' />
            <Picker.Item label='Libre de lactosa' value='libre de lactosa' />
            <Picker.Item label='Libre de frutos secos' value='libre de frutos secos' />
          </Picker>
        </View>

        {/* Botones centrados */}
        <View style={styles.formButtonsContainer}>
          <CustomButton
            title={hasChanges ? 'GUARDAR CAMBIOS' : 'SIN CAMBIOS'}
            onPress={hasChanges ? handleSubmit : () => {}}
            iconName={hasChanges ? 'save-outline' : 'checkmark-circle-outline'}
            iconPosition='right'
            iconColor='#1a1919'
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
            iconColor='#1a1919'
            iconSize={20}
            style={styles.logoutButton}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Vista principal
  container: {
    flex: 1,
    backgroundColor: '#1a1919',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1919',
    padding: 30,
  },
  loadingText: {
    color: '#999',
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },

  // Header del perfil
  profileHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#1a1919',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  profileTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 15,
    color: '#999',
  },

  // Cards
  card: {
    backgroundColor: '#252525',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginLeft: 12,
  },

  // Divisor dentro de cards
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },

  // Grid de estadísticas
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    minWidth: '28%',
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },

  // Filas de información
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 15,
    marginLeft: 10,
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Estado vacío
  emptyCard: {
    backgroundColor: '#252525',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  noProfileText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  noProfileSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Botones
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#1a1919',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  exitButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c0392b',
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#1a1919',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Formulario de edición
  editHeader: {
    backgroundColor: '#252525',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  backButtonEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editHeaderTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  formCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginLeft: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#ccc',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    color: '#fff',
    backgroundColor: '#1f1f1f',
    fontSize: 16,
  },
  picker: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#D4AF37',
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
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#666',
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default ProfileScreen;

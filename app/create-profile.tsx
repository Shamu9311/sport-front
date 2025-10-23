import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { saveUserProfile } from '../src/services/api';
import CustomButton from '../src/components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons'; // Import Ionicons for back button

// Definición de tipos para el perfil de usuario
type Gender = 'M' | 'F' | 'O';
type TrainingFrequency = '1-2' | '3-4' | '5+';
type PrimaryGoal = 'muscle_gain' | 'weight_loss' | 'performance' | 'general_health';
type ActivityLevel = 'sedentary' | 'moderate' | 'active' | 'very_active';
type SweatLevel = 'low' | 'medium' | 'high';
type CaffeineTolerance = 'none' | 'low' | 'medium' | 'high';

// Interfaz mejorada para el perfil de usuario
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
  dietary_restrictions: string[];
  allergies: string[]; // Still included in type for backend, but not directly in this multi-step UI
  preferred_supplements: string[]; // Still included in type for backend, but not directly in this multi-step UI
}

const CreateProfileScreen = () => {
  const { user, setHasProfile } = useAuth();
  const router = useRouter();

  // State to manage the current step of the multi-page form
  const [currentStep, setCurrentStep] = useState(0);

  const [profileData, setProfileData] = useState<ProfileData>({
    age: '',
    weight: '',
    height: '',
    gender: 'M',
    training_frequency: '3-4',
    primary_goal: 'muscle_gain',
    activity_level: 'moderate',
    sweat_level: 'medium',
    caffeine_tolerance: 'medium',
    dietary_restrictions: [],
    allergies: [],
    preferred_supplements: [],
  });

  // State for dietary restrictions input (as a string before parsing)
  const [dietaryRestrictionsInput, setDietaryRestrictionsInput] = useState('');

  // Handles changes for all profile data fields
  const handleChange = (field: keyof ProfileData, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Navigates to the next step
  const handleNext = () => {
    // Basic validation before moving to the next step for required fields
    if (currentStep === 1 && !profileData.age) {
      Alert.alert('Campo Requerido', 'Por favor selecciona tu edad.');
      return;
    }
    if (currentStep === 3 && !profileData.weight) {
      Alert.alert('Campo Requerido', 'Por favor selecciona tu peso.');
      return;
    }
    if (currentStep === 5 && !profileData.height) {
      Alert.alert('Campo Requerido', 'Por favor selecciona tu altura.');
      return;
    }
    // For pickers, default values are set, so validation might not be strictly necessary for them

    setCurrentStep((prev) => prev + 1);
  };

  // Navigates to the previous step
  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Handles saving the user profile
  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear un perfil');
      return;
    }

    try {
      // Final validation before saving
      if (!profileData.age || !profileData.weight || !profileData.height) {
        Alert.alert('Error', 'Por favor completa todos los campos obligatorios antes de guardar.');
        return;
      }

      // Parse dietary restrictions from string input to array
      const parsedDietaryRestrictions = dietaryRestrictionsInput
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== ''); // Remove empty strings

      const profileToSave = {
        ...profileData,
        // Convert string values to numbers
        age: parseInt(profileData.age),
        weight: parseInt(profileData.weight),
        height: parseInt(profileData.height),
        // Ensure dietary_restrictions has a valid value (['no'] if empty string, otherwise parsed array)
        dietary_restrictions:
          parsedDietaryRestrictions.length > 0 ? parsedDietaryRestrictions : ['no'],
        // These fields are not part of the multi-step UI, but ensure they are sent
        allergies: profileData.allergies.length > 0 ? profileData.allergies : [''],
        preferred_supplements:
          profileData.preferred_supplements.length > 0 ? profileData.preferred_supplements : [''],
      };

      console.log('Enviando datos de perfil:', profileToSave);

      const response = await saveUserProfile(user.id, profileToSave);

      if (response.success) {
        // Update the profile state and then navigate
        setHasProfile(true);

        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          Alert.alert(
            'Perfil Guardado',
            '¡Tu perfil ha sido creado con éxito! Ahora analizaremos tus datos para ofrecerte recomendaciones personalizadas.',
            [
              {
                text: 'Continuar',
                onPress: () => {
                  // Use replace to prevent going back to the profile creation
                  router.replace({
                    pathname: '/loading-profile',
                    params: { fromProfileCreation: 'true' },
                  });
                },
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

  // Renders the content for each step based on `currentStep`
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>¡Bienvenido!</Text>
            <Text style={styles.subtitle}>
              Vamos a comenzar creando tu perfil. Proporciona tu información para que podamos
              ayudarte mejor.
            </Text>
            <CustomButton
              title='COMENZAR'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 1: // Age
        return (
          <View style={[styles.stepContainer]}>
            <Text style={styles.label}>¿Cuál es tu edad?</Text>
            <Picker
              selectedValue={profileData.age}
              style={[styles.picker]}
              onValueChange={(value) => handleChange('age', value)}
              dropdownIconColor='#F8D930'
              itemStyle={
                {
                  // height: 50,
                }
              }
            >
              <Picker.Item label='Selecciona tu edad' value='' />
              {Array.from({ length: 83 }, (_, i) => i + 18).map((age) => (
                <Picker.Item key={age} label={`${age} años`} value={age.toString()} />
              ))}
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={[styles.button]}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 2: // Motivation 1
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>Tu esfuerzo es real. Nuestra guía también.</Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 3: // Weight
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Ingresa tu peso actual (kg):</Text>
            <Picker
              selectedValue={profileData.weight}
              style={styles.picker}
              onValueChange={(value) => handleChange('weight', value)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='Selecciona tu peso' value='' />
              {Array.from({ length: 151 }, (_, i) => i + 40).map((weight) => (
                <Picker.Item key={weight} label={`${weight} kg`} value={weight.toString()} />
              ))}
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 4: // Motivation 2
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>
              Cada dato que ingresas es un paso hacia tu mejor versión.
            </Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 5: // Height
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>¿Cuál es tu estatura? (cm)</Text>
            <Picker
              selectedValue={profileData.height}
              style={styles.picker}
              onValueChange={(value) => handleChange('height', value)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='Selecciona tu altura' value='' />
              {Array.from({ length: 91 }, (_, i) => i + 140).map((height) => (
                <Picker.Item key={height} label={`${height} cm`} value={height.toString()} />
              ))}
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 6: // Motivation 3
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>
              La constancia vence al talento. Tú ya estás empezando bien.
            </Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 7: // Gender
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Selecciona tu género:</Text>
            <Picker
              selectedValue={profileData.gender}
              style={styles.picker}
              onValueChange={(value) => handleChange('gender', value as Gender)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='Masculino' value='M' />
              <Picker.Item label='Femenino' value='F' />
              <Picker.Item label='Otro' value='O' />
              <Picker.Item label='Prefiero no decir' value='O' />
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 8: // Motivation 4
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>
              Tu identidad es única. Tu camino también lo será.
            </Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 9: // Activity Level
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>¿Qué tan activo eres en tu día a día?</Text>
            <Picker
              selectedValue={profileData.activity_level}
              style={styles.picker}
              onValueChange={(value) => handleChange('activity_level', value)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='Sedentario' value='sedentary' />
              <Picker.Item label='Moderado (1-3 días/sem)' value='moderate' />
              <Picker.Item label='Activo (3-5 días/sem)' value='active' />
              <Picker.Item label='Muy activo (6-7 días/sem)' value='very_active' />
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 10: // Motivation 5
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>
              Lo importante no es de dónde partes, sino a dónde vas.
            </Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 11: // Training Frequency
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>¿Con qué frecuencia entrenas a la semana?</Text>
            <Picker
              selectedValue={profileData.training_frequency}
              style={styles.picker}
              onValueChange={(value) => handleChange('training_frequency', value)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='1-2 veces por semana' value='1-2' />
              <Picker.Item label='3-4 veces por semana' value='3-4' />
              <Picker.Item label='5+ veces por semana' value='5+' />
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 12: // Motivation 6
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>
              El primer paso ya cuenta. Lo demás, lo hacemos juntos.
            </Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 13: // Primary Goal
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>¿Cuál es tu objetivo principal?</Text>
            <Picker
              selectedValue={profileData.primary_goal}
              style={styles.picker}
              onValueChange={(value) => handleChange('primary_goal', value)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='Ganancia muscular' value='muscle_gain' />
              <Picker.Item label='Pérdida de peso' value='weight_loss' />
              <Picker.Item label='Rendimiento deportivo' value='performance' />
              <Picker.Item label='Salud general' value='general_health' />
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 14: // Motivation 7
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>
              Un objetivo claro es el motor de un cambio real.
            </Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 15: // Sweat Level
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>¿Qué tanto sudas durante el ejercicio?</Text>
            <Picker
              selectedValue={profileData.sweat_level}
              style={styles.picker}
              onValueChange={(value) => handleChange('sweat_level', value)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='Bajo - Apenas sudo' value='low' />
              <Picker.Item label='Medio - Sudoración normal' value='medium' />
              <Picker.Item label='Alto - Sudo mucho' value='high' />
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 16: // Motivation 8
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>Sudar es señal de esfuerzo. ¡Vamos bien!</Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 17: // Caffeine Tolerance
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>¿Cómo es tu tolerancia a la cafeína?</Text>
            <Picker
              selectedValue={profileData.caffeine_tolerance}
              style={styles.picker}
              onValueChange={(value) => handleChange('caffeine_tolerance', value)}
              dropdownIconColor='#F8D930'
            >
              <Picker.Item label='No consumo cafeína' value='none' />
              <Picker.Item label='Baja - Me afecta mucho' value='low' />
              <Picker.Item label='Media - Efecto normal' value='medium' />
              <Picker.Item label='Alta - Necesito mucha' value='high' />
            </Picker>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 18: // Motivation 9
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.motivationText}>
              Conociendo tu cuerpo, maximizamos tus resultados.
            </Text>
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 19: // Dietary Restrictions (Text input for comma-separated values)
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>¿Tienes alguna restricción alimenticia?</Text>
            <Text style={styles.smallText}>
              (Ej. Vegetariano, sin gluten, sin lactosa. Separa con comas)
            </Text>
            <TextInput
              style={styles.textInput}
              value={dietaryRestrictionsInput}
              onChangeText={setDietaryRestrictionsInput}
              placeholder='Ninguna'
              placeholderTextColor='#888'
            />
            <CustomButton
              title='SIGUIENTE'
              onPress={handleNext}
              style={styles.button}
              iconName='arrow-forward-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
            />
          </View>
        );
      case 20: // Final Motivation and Save
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>¡Listo!</Text>
            <Text style={styles.subtitle}>
              Ya tenemos tu perfil. Ahora empieza tu camino hacia una versión más fuerte, más sana y
              más feliz de ti.
            </Text>
            <CustomButton
              title='GUARDAR PERFIL'
              iconName='save-outline'
              iconPosition='right'
              iconSize={24}
              iconColor='#1a1919'
              onPress={handleSaveProfile}
              style={styles.button}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps='handled'
      nestedScrollEnabled={true}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {currentStep > 0 && ( // Show back button on all steps except the first one (welcome screen)
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name='arrow-back-outline' size={30} color='#F8D930' />
        </TouchableOpacity>
      )}
      <View style={styles.content}>{renderStepContent()}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1919',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    minHeight: 600, // Ensure enough height for content
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  stepContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8D930',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 40,
    lineHeight: 30,
  },
  formGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    color: '#F8D930',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 14,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    // backgroundColor: '#333',
    color: '#fff',
    // height: 50,
    borderRadius: 20,
    // overflow: 'visible', // Ensure border-radius applies
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    width: '80%',
    backgroundColor: '#F8D930',
    marginTop: 30,
    marginBottom: 20, // Adjusted margin for consistency
  },
});

export default CreateProfileScreen;

import axios from 'axios';
import { UserData, UserProfileData } from '../types/UserTypes';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://10.26.16.138:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autorización a todas las requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Configura interceptores para manejar errores y tokens expirados
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Manejar token expirado o inválido
    if (error.response?.status === 401) {
      try {
        // Limpiar sesión si el token es inválido
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        console.log('⚠️ Token inválido, sesión limpiada');
      } catch (storageError) {
        console.error('Error cleaning storage:', storageError);
      }
    }

    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      return Promise.reject({
        message: error.response.data.message || 'Error en la solicitud',
        status: error.response.status,
        response: error.response,
      });
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      return Promise.reject({
        message: 'No se recibió respuesta del servidor',
      });
    } else {
      // Algo sucedió al configurar la solicitud
      return Promise.reject({
        message: 'Error al configurar la solicitud',
      });
    }
  }
);

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRecommendations = async (userId: number) => {
  try {
    console.log(`Obteniendo recomendaciones para usuario ${userId}`);
    const response = await api.get(`/recommendations/${userId}`);
    console.log('Respuesta completa del backend:', response.data);

    // El backend devuelve un objeto con propiedades 'message' y 'recommendations'
    let recommendations = [];

    if (
      response.data &&
      response.data.recommendations &&
      Array.isArray(response.data.recommendations)
    ) {
      recommendations = response.data.recommendations;
      console.log(`Recomendaciones encontradas en la respuesta: ${recommendations.length}`);
    } else if (Array.isArray(response.data)) {
      recommendations = response.data;
      console.log('Respuesta directamente es un array');
    } else {
      console.log('Formato de respuesta inesperado:', response.data);
    }

    // Definimos una interfaz para los productos recomendados
    interface ProductRecommendation {
      product_id: number;
      name?: string;
      description?: string;
      reasoning?: string;
      [key: string]: any; // Para cualquier otra propiedad que pueda tener el producto
    }

    // Proceso adicional para asegurar que cada recomendación tenga todos los campos necesarios
    if (recommendations.length > 0) {
      // Completar los datos faltantes con valores predeterminados
      const processedRecommendations = recommendations.map((product: ProductRecommendation) => ({
        ...product,
        // Usar los campos correctos del backend
        name: product.product_name || product.name || `Producto ${product.product_id}`,
        description:
          product.product_description ||
          product.description ||
          'Información no disponible en este momento',
        // Asegurar que tenemos una imagen
        image_url: product.image_url || '/assets/default-product.png',
      }));

      console.log(`Recomendaciones recibidas correctamente: ${processedRecommendations.length}`);
      return processedRecommendations;
    }

    return recommendations;
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    throw error;
  }
};

export const addConsumption = async (userId: number, productId: number, quantity: number) => {
  try {
    const response = await api.post(`/users/${userId}/consumption`, { productId, quantity });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (userId: number) => {
  try {
    const response = await api.get(`/profile/${userId}/profile`);
    console.log('Respuesta de getProfile:', response.data);

    // Si la respuesta es exitosa y tiene datos de perfil
    if (response.data && response.data.success && response.data.data?.profile) {
      return {
        success: true,
        data: {
          user: response.data.data.user,
          profile: {
            ...response.data.data.profile,
            dietary_restrictions: response.data.data.profile?.dietary_restrictions
              ? response.data.data.profile.dietary_restrictions.split(',')
              : [],
          },
        },
      };
    }

    // Si la respuesta es exitosa pero no hay perfil
    if (response.data && response.data.success && !response.data.data?.profile) {
      console.log('Perfil no encontrado en la respuesta');
      return {
        success: false,
        data: null,
        message: 'Usuario sin perfil',
      };
    }

    // Para cualquier otro caso de respuesta no exitosa
    return {
      success: false,
      data: null,
      message: response.data?.message || 'No se pudo obtener el perfil',
    };
  } catch (error: any) {
    console.error('Error en getProfile:', error);
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un estado fuera del rango 2xx
      if (error.response.status === 404) {
        console.log('Perfil no encontrado (404)');
        return {
          success: false,
          data: null,
          message: 'Usuario sin perfil',
        };
      }
      return {
        success: false,
        data: null,
        message: `Error del servidor: ${error.response.status} - ${error.response.data?.message || 'Error desconocido'
          }`,
      };
    } else if (error.request) {
      // La solicitud fue hecha pero no hubo respuesta
      return {
        success: false,
        data: null,
        message: 'No se pudo conectar con el servidor',
      };
    }
    // Error al configurar la solicitud
    return {
      success: false,
      data: null,
      message: 'Error al procesar la solicitud de perfil',
    };
  }
};

export const saveUserProfile = async (userId: number, profileData: UserProfileData) => {
  try {
    // Preparar los datos para el backend
    const preparedData = {
      ...profileData,
      // Convertir arrays a strings para el backend
      dietary_restrictions: Array.isArray(profileData.dietary_restrictions)
        ? profileData.dietary_restrictions.join(',')
        : profileData.dietary_restrictions || '',
    };

    // Asegurar que la ruta es correcta y coincide con el backend
    const response = await api.post(`/profile/${userId}/profile`, preparedData);
    return response.data;
  } catch (error: any) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getProductCategories = async () => {
  try {
    const response = await api.get('/products/categories');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductsByCategory = async (categoryId: string) => {
  try {
    console.log(`Solicitando productos para la categoría ${categoryId}`);
    const response = await api.get(`/products/category/${categoryId}`);

    let products = [];

    // Manejar diferentes formatos de respuesta
    if (response.data && Array.isArray(response.data)) {
      // Si la respuesta es directamente un array de productos
      products = response.data;
    } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
      // Si la respuesta tiene una propiedad 'products' que es un array
      products = response.data.products;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Si la respuesta tiene una propiedad 'data' que es un array
      products = response.data.data;
    }

    console.log(`Productos recibidos para categoría ${categoryId}:`, products.length);

    // Asegurarse de que cada producto tenga los campos necesarios
    const processedProducts = products.map((product: any) => ({
      ...product,
      product_name: product.product_name || product.name || `Producto ${product.product_id}`,
      product_description:
        product.product_description || product.description || 'Descripción no disponible',
      image_url: product.image_url || '/assets/default-product.png',
      // Asegurar que los campos opcionales tengan valores por defecto
      price: product.price || 0,
      category_id: product.category_id || parseInt(categoryId, 10),
    }));

    console.log(`Productos procesados para categoría ${categoryId}:`, processedProducts.length);
    return processedProducts;
  } catch (error) {
    console.error('Error en getProductsByCategory:', error);
    throw error;
  }
};

export const getProductDetails = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductNutrition = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}/nutrition`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductFlavors = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}/flavors`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener recomendaciones guardadas para un usuario
export const getSavedRecommendations = async (userId: number) => {
  try {
    const response = await api.get(`/recommendations/saved/${userId}`);
    let recommendations = [];
    if (
      response.data &&
      response.data.recommendations &&
      Array.isArray(response.data.recommendations)
    ) {
      recommendations = response.data.recommendations;
    }
    return recommendations;
  } catch (error) {
    console.error('Error al obtener recomendaciones guardadas:', error);
    throw error;
  }
};

export const getProductAttributes = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}/attributes`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to safely get token from storage
const getToken = async () => {
  try {
    // Use AsyncStorage for React Native
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      return await AsyncStorage.getItem('token');
    }
    // Use localStorage for web if available
    else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  } catch (error) {
    console.warn('Error accessing storage:', error);
    return null;
  }
};

// Obtener todas las sesiones de entrenamiento del usuario
export const getUserTrainingSessions = async (userId: number) => {
  try {
    const response = await api.get(`/training/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    throw error;
  }
};

// Obtener una sesión de entrenamiento específica
export const getTrainingSession = async (sessionId: number) => {
  try {
    const response = await api.get(`/training/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training session:', error);
    throw error;
  }
};

// Crear una nueva sesión de entrenamiento
export const createTrainingSession = async (trainingData: {
  userId: number;
  sessionDate: string;
  durationMin: number;
  intensity: string;
  type: string;
  weather?: string;
  notes?: string;
}) => {
  try {
    const response = await api.post('/training', trainingData);
    return response.data;
  } catch (error) {
    console.error('Error creating training session:', error);
    throw error;
  }
};

// Actualizar una sesión de entrenamiento existente
export const updateTrainingSession = async (
  sessionId: number,
  trainingData: {
    sessionDate: string;
    durationMin: number;
    intensity: string;
    type: string;
    weather?: string;
    notes?: string;
  }
) => {
  try {
    const response = await api.put(`/training/${sessionId}`, trainingData);
    return response.data;
  } catch (error) {
    console.error('Error updating training session:', error);
    throw error;
  }
};

// Eliminar una sesión de entrenamiento
export const deleteTrainingSession = async (sessionId: number) => {
  try {
    const response = await api.delete(`/training/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting training session:', error);
    throw error;
  }
};

// Obtener recomendaciones basadas en una sesión de entrenamiento
export const getTrainingRecommendations = async (trainingId: number, userId: number) => {
  try {
    const response = await api.post('/recommendations/training', { trainingId, userId });

    let recommendations = [];

    if (response.data && Array.isArray(response.data)) {
      recommendations = response.data;
    } else if (
      response.data &&
      response.data.recommendations &&
      Array.isArray(response.data.recommendations)
    ) {
      recommendations = response.data.recommendations;
    }

    return recommendations;
  } catch (error) {
    console.error('Error fetching training recommendations:', error);
    throw error;
  }
};

export default api;

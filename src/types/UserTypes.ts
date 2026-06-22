// Valores alineados con ENUMs MySQL / edición de perfil en la app
export type Gender = 'hombre' | 'mujer' | 'otro' | 'prefiero no decir';
export type ActivityLevel = 'sedentario' | 'moderado' | 'activo' | 'muy activo';
export type TrainingFrequency = '1-2' | '3-4' | '5+' | 'ocasional';
export type PrimaryGoal =
  | 'mejor rendimiento'
  | 'perder peso'
  | 'ganar musculo'
  | 'resistencia'
  | 'recuperacion'
  | 'por salud';
export type SweatLevel = 'bajo' | 'medio' | 'alto';
export type CaffeineTolerance = 'no' | 'bajo' | 'medio' | 'alto';
export type DietaryRestriction = string;

export interface UserProfileData {
  age: string | number;
  weight: string | number;
  height: string | number;
  gender: Gender;
  activity_level: ActivityLevel;
  training_frequency: TrainingFrequency;
  primary_goal: PrimaryGoal;
  sweat_level: SweatLevel;
  caffeine_tolerance: CaffeineTolerance;
  /** Una sola restricción principal o lista para compatibilidad */
  dietary_restrictions: string | string[];
  allergies?: string[];
  preferred_supplements?: string[];
}

export interface UserData {
  id?: number;
  username: string;
  email: string;
  password?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  profile: UserProfileData;
}

export interface ProductCategory {
  category_id: number;
  name: string;
  description: string;
  usage_context: string;
}

export interface ProductType {
  type_id: number;
  category_id: number;
  name: string;
  description: string;
}

export interface Product {
  product_id: number;
  type_id: number;
  name: string;
  description: string;
  image_url: string;
  usage_recommendation: string;
  is_active: boolean;
  type_name?: string;
  type_description?: string;
}

export interface ProductFlavor {
  flavor_id: number;
  product_id: number;
  name: string;
}

export interface ProductNutrition {
  nutrition_id: number;
  product_id: number;
  serving_size: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  sugars_g: number;
  sodium_mg: number;
  potassium_mg: number;
  magnesium_mg: number;
  caffeine_mg: number;
  other_components: string;
}

export interface ProductAttribute {
  attribute_id: number;
  name: string;
  description: string;
}

export interface ProductDetail {
  product: Product;
  nutrition: ProductNutrition;
  flavors: ProductFlavor[];
  attributes: ProductAttribute[];
}

export interface AuthContextType {
  user: UserData | null;
  userToken: string | null;
  isLoadingAuth: boolean;
  hasProfile: boolean | null;
  isCheckingProfile: boolean;
  profileVerified: boolean;
  login: (userData: UserData, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkUserProfile: () => Promise<boolean>;
  setHasProfile: (value: boolean) => void;
  handleRouteChanges: () => void;
}

export interface TrainingSession {
  session_id: number;
  user_id: number;
  session_date: string;
  start_time: string;
  duration_min: number;
  intensity: string;
  type: string;
  weather: string;
  sport_type: string;
  notes?: string;
}

export interface SavedRecommendation {
  recommendation_id?: number;
  product_id?: number;
  session_id?: number | null;
  product_name?: string;
  product_description?: string;
  image_url?: string;
  reasoning?: string;
  reasoningText?: string;
  feedback?: string;
  feedback_notes?: string;
  product_details?: {
    product_id: number;
    name?: string;
    product_name?: string;
    description?: string;
    product_description?: string;
    image_url?: string;
  };
}

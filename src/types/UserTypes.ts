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

/** Fuente que respalda (o matiza) una recomendación Evidence RAG. Sin datos técnicos. */
export interface RecommendationEvidence {
  source_id: number;
  title: string;
  year?: number | null;
  source_type?: string | null;
  source_category?: string | null;
  summary?: string | null;
  doi?: string | null;
  url?: string | null;
  role: 'supports' | 'caveat' | 'usage_constraint';
}

/** Estado de generación de recomendaciones de una sesión (solo Evidence RAG). */
export type RecommendationStatus = 'pending' | 'ready' | 'none' | 'failed';

/** Función neutra del hueco (fase + función) que ocupa una recomendación Evidence RAG. */
export type FunctionalRole = 'fueling' | 'hydration' | 'protein_support' | 'caffeine' | 'supplementation';

/** Objetivo nutricional derivado del claim científico (no del producto). */
export interface RecommendationTarget {
  nutrient: string;
  min: number | null;
  max: number | null;
  unit: string | null;
  tier?: 'principal' | 'contextual';
}

/** Plan de uso calculado por el servidor. */
export interface RecommendationUsagePlan {
  type: 'rate' | 'servings';
  servings_per_hour_min?: number;
  servings_per_hour_max?: number;
  interval_minutes_min?: number;
  interval_minutes_max?: number;
  servings_total_min?: number | null;
  servings_total_max?: number | null;
  repeat_same_product?: boolean;
  servings?: number;
  concentration_mg_per_l?: number;
  dose_mg_per_kg?: number;
  achievable?: { min: number; max: number; unit: string };
  caffeine?: { mg_min: number; mg_max: number; mg_per_kg_min: number | null; mg_per_kg_max: number | null } | null;
  includes?: { product_id: number; product_name: string; carbohydrate_g: number; replaces_servings: number }[];
  replaces?: { product_id: number; product_name: string; servings: number; carbohydrate_g: number };
  text?: string;
}

/** Alternativa del mismo hueco: en lugar del producto principal, no además. */
export interface RecommendationAlternative {
  product_id: number;
  product_name: string;
  image_url?: string | null;
  cadence_status?: 'cadence_verified' | 'cadence_unverified' | null;
  usage_plan?: RecommendationUsagePlan | null;
  reason: string;
}

export interface SavedRecommendation {
  role?: FunctionalRole | null;
  functional_role?: FunctionalRole | null;
  also_covers?: FunctionalRole[];
  target?: RecommendationTarget | null;
  usage_plan?: RecommendationUsagePlan | null;
  alternatives?: RecommendationAlternative[];
  evidence?: RecommendationEvidence[];
  evidence_mode?: 'legacy' | 'evidence_rag';
  cadence_status?: 'cadence_verified' | 'cadence_unverified' | null;
  evidence_note?: string | null;
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
  consumption_timing?: string | null;
  consumption_instructions?: string | null;
  recommended_quantity?: string | null;
  timing_minutes?: number | null;
  recommended_at?: string;
  // Contexto de la sesión (GET /recommendations/saved)
  session_date?: string | null;
  start_time?: string | null;
  duration_min?: number | null;
  session_sport_type?: string | null;
  product_details?: {
    product_id: number;
    name?: string;
    product_name?: string;
    description?: string;
    product_description?: string;
    image_url?: string;
  };
}

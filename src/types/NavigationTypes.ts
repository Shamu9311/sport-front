export type RootStackParamList = {
    PersonalDataForm: undefined;
    // Add other routes here
    ProductListScreen: undefined; // Added ProductList route
    ProductDetailScreen: { productId: string }; // Added ProductDetail route
    ProductCategoryScreen: { categoryId: string }; // Added ProductCategory route
    ProductTypeScreen: { typeId: string }; // Added ProductType route
    ProductFlavorScreen: { flavorId: string }; // Added ProductFlavor route
    ProductNutritionScreen: { nutritionId: string }; // Added ProductNutrition route
    ProductAttributeScreen: { attributeId: string }; // Added ProductAttribute route
  };
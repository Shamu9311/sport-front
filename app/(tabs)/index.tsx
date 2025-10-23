import React from 'react';
import { StyleSheet, View, Text, Image, SafeAreaView, Dimensions, Platform } from 'react-native';
// Opcional: si quieres personalizar el saludo con el nombre del usuario
// import { useAuth } from '../../src/context/AuthContext';

// Obtener dimensiones de la pantalla para hacer el diseño responsivo
const { width, height } = Dimensions.get('window');

// --- Asegúrate que la ruta a tu logo sea correcta desde este archivo ---
// Ejemplo: si index.tsx está en app/(tabs)/ y tu logo en assets/images/
const logoPath = require('../../assets/images/login.png'); // <-- ¡CAMBIA ESTO POR LA RUTA REAL DE TU LOGO!

const HomeScreen = () => {
  // Opcional: Obtener usuario para saludo personalizado
  // const { user } = useAuth();

  return (
    // SafeAreaView para respetar notches y áreas seguras
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image source={logoPath} style={styles.logo} resizeMode='contain' />

        <Text style={styles.title}>Tu Asistente de Rendimiento Deportivo</Text>

        <Text style={styles.description}>
          Analizamos la información de tu <Text style={styles.highlight}>Perfil</Text> y las
          características de nuestros productos para recomendarte la combinación ideal de
          suplementos. Optimiza tu <Text style={styles.highlight}>energía</Text>,{' '}
          <Text style={styles.highlight}>hidratación</Text> y{' '}
          <Text style={styles.highlight}>recuperación</Text> para alcanzar tus metas deportivas.
        </Text>

        <Text style={styles.instructions}>
          Para obtener las mejores recomendaciones, asegúrate de que la información en la pestaña{' '}
          <Text style={styles.highlight}>"Perfil"</Text> esté completa y actualizada.
        </Text>

        {/* Podrías añadir un botón aquí si quisieras una acción específica */}
        {/* <CustomButton title="Ver Productos" onPress={() => router.push('/(tabs)/products')} /> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1919', // Fondo oscuro para toda el área segura
  },
  container: {
    flex: 1,
    alignItems: 'center', // Centrar contenido horizontalmente
    justifyContent: 'center', // Centrar contenido verticalmente
    paddingHorizontal: width * 0.08, // Padding horizontal responsivo (8% del ancho)
    paddingVertical: Platform.OS === 'ios' ? 5 : 5, // Padding diferente para iOS y Android
  },
  logo: {
    width: width * 0.7, // 70% del ancho de la pantalla (responsivo)
    height: height * 0.15, // 15% de la altura de la pantalla
    marginBottom: 25, // Espacio debajo del logo
    marginTop: Platform.OS === 'android' ? 10 : 0, // Ajuste para Android
  },
  title: {
    fontSize: width < 375 ? 24 : 28, // Tamaño responsivo según el ancho del dispositivo
    fontWeight: 'bold',
    color: '#F8D930', // Color de acento
    textAlign: 'center',
    marginBottom: 20, // Espacio entre el título y la descripción
    paddingHorizontal: 15, // Espacio interno lateral
    lineHeight: width < 375 ? 30 : 34, // Altura de línea responsiva
  },
  description: {
    fontSize: width < 375 ? 15 : 17, // Tamaño de fuente responsivo
    color: '#d3d3d3', // Texto legible sobre fondo oscuro (lightgray más específico)
    textAlign: 'center',
    lineHeight: width < 375 ? 22 : 26, // Espaciado entre líneas para mejor lectura
    marginBottom: 20, // Espacio entre párrafos
    paddingHorizontal: 5, // Un poco más de padding interno
  },
  highlight: {
    color: '#F8D930', // Resaltar palabras clave
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: width < 375 ? 12 : 13, // Tamaño de fuente responsivo
    color: '#a0a0a0', // Un gris un poco más tenue
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 25, // Espacio antes de esta instrucción final
    lineHeight: width < 375 ? 18 : 20, // Altura de línea responsiva
    paddingHorizontal: 10, // Padding adicional para que no toque los bordes
  },
});

export default HomeScreen;

// Sport/app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome'; // Usas FontAwesome
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Necesitamos este para el ícono 'brain'

// Función helper para el icono de FontAwesome (la mantienes)
function TabBarIconFA(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

// Función helper para el icono de MaterialCommunityIcons (nueva)
function TabBarIconMCI(props: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  focused?: boolean;
}) {
  // Hacemos el ícono 'focused' un poco más grande si lo deseas, como en mi ejemplo JS
  const iconSize = props.focused ? 30 : 28;
  return (
    <MaterialCommunityIcons
      size={iconSize}
      style={{ marginBottom: -3 }}
      name={props.name}
      color={props.color}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F8D930', // Tu color activo
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#1a1a19' }, // Color de fondo de la barra
        // headerShown: true, // Lo mantenemos si esa es tu preferencia global
        // Si quieres controlar headerShown individualmente por pantalla, ponlo en 'options' de cada Tab.Screen
        // Por ejemplo, para Recommendations podríamos querer un header diferente o ninguno,
        // pero por ahora, usaremos el default.
      }}
    >
      <Tabs.Screen
        name='index' // Asume que tienes un archivo app/(tabs)/index.tsx
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabBarIconFA name='home' color={color} />,
          headerShown: false, // Ejemplo: Si quieres que solo esta tab no tenga header global
        }}
      />
      <Tabs.Screen
        name='products' // Nombre de tu archivo para la lista de productos (ej. products.tsx)
        options={{
          title: 'Productos',
          tabBarIcon: ({ color }) => <TabBarIconFA name='shopping-bag' color={color} />,
          headerShown: false,
        }}
      />

      {/* --- PANTALLA DE ENTRENAMIENTO --- */}
      <Tabs.Screen
        name='training' // DEBE COINCIDIR con el nombre del archivo: app/(tabs)/training.tsx
        options={{
          title: 'Entrenar',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIconMCI name='dumbbell' color={color} focused={focused} />
          ),
          headerShown: false,
        }}
      />

      {/* --- PANTALLA DE RECOMENDACIONES --- */}
      <Tabs.Screen
        name='recommendations' // DEBE COINCIDIR con el nombre del archivo: app/(tabs)/recommendations.tsx
        options={{
          title: 'Sugerencias',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIconMCI
              name={focused ? 'lightbulb-on' : 'lightbulb'}
              color={color}
              focused={focused}
            />
          ),
          // headerTitle: 'Tus Recomendaciones', // Título para la cabecera de esta pantalla si headerShown es true
          headerShown: false, // Decide si quieres cabecera para esta pantalla específica
        }}
      />
      {/* --- FIN NUEVA PANTALLA --- */}

      <Tabs.Screen
        name='profile' // Nombre de tu archivo para el perfil (ej. profile.tsx)
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIconFA name='user' color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

// Sport/app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Función helper para el icono de FontAwesome
function TabBarIconFA(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused?: boolean;
}) {
  const iconSize = props.focused ? 26 : 24;
  return <FontAwesome size={iconSize} {...props} />;
}

// Función helper para el icono de MaterialCommunityIcons
function TabBarIconMCI(props: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  focused?: boolean;
}) {
  const iconSize = props.focused ? 26 : 24;
  return <MaterialCommunityIcons size={iconSize} name={props.name} color={props.color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#1a1919',
          borderTopWidth: 1,
          borderTopColor: '#333',
          height: Platform.OS === 'ios' ? 38 + insets.bottom : 38,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 3,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIconFA name='home' color={color} focused={focused} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name='products'
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIconFA name='shopping-bag' color={color} focused={focused} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name='training'
        options={{
          title: 'Entrenar',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIconMCI name='dumbbell' color={color} focused={focused} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name='recommendations'
        options={{
          title: 'Sugerencias',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIconMCI
              name={focused ? 'lightbulb-on' : 'lightbulb'}
              color={color}
              focused={focused}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIconFA name='user' color={color} focused={focused} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

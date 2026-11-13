// Sport/app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily } from '../../src/theme';

function TabBarIconFA(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused?: boolean;
}) {
  const iconSize = props.focused ? 26 : 24;
  return (
    <View style={styles.iconWrap}>
      <FontAwesome size={iconSize} name={props.name} color={props.color} />
      {props.focused ? <View style={styles.tabIndicator} /> : null}
    </View>
  );
}

function TabBarIconMCI(props: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  focused?: boolean;
}) {
  const iconSize = props.focused ? 26 : 24;
  return (
    <View style={styles.iconWrap}>
      <MaterialCommunityIcons size={iconSize} name={props.name} color={props.color} />
      {props.focused ? <View style={styles.tabIndicator} /> : null}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        animation: 'shift',
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          // Altura suficiente para ícono + etiqueta: antes (60) la etiqueta quedaba recortada y la barra
          // se veía solo con íconos, poco claros (p. ej. "Entrenar").
          height: Platform.OS === 'ios' ? 64 + insets.bottom : 70,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fontFamily.semibold,
          marginTop: 2,
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

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 26,
  },
  // Con etiquetas visibles el punto indicador sobra; se mantiene el componente por compatibilidad
  tabIndicator: {
    display: 'none',
  },
});

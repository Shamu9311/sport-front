import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  style?: object;
  iconName?: keyof typeof Ionicons.glyphMap; // Nombre del icono (ej: "save")
  iconPosition?: 'left' | 'right'; // Posición del icono
  iconColor?: string;
  iconSize?: number;
};

const CustomButton: React.FC<CustomButtonProps> = ({ 
    title, 
    onPress, 
    style, 
    iconName,
    iconPosition = 'left',
    iconColor = '#000',
    iconSize = 20,
    }) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
    >
      <View style={styles.contentContainer}>
        {iconName && iconPosition === 'left' && (
          <Ionicons 
            name={iconName} 
            size={iconSize} 
            color={iconColor} 
            style={styles.iconLeft}
          />
        )}
      <Text style={styles.buttonText}>{title}</Text>
      {iconName && iconPosition === 'right' && (
          <Ionicons 
            name={iconName} 
            size={iconSize} 
            color={iconColor} 
            style={styles.iconRight}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
    width: '80%',
  },
  buttonText: {
    color: '#1a1919',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default CustomButton;
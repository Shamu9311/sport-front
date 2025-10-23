import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

type Field = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
};

type AuthFormProps = {
  fields: Field[];
};

const AuthForm: React.FC<AuthFormProps> = ({ fields }) => {
  return (
    <View style={styles.container}>
      {fields.map((field, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            value={field.value}
            returnKeyType='next'
            onChangeText={field.onChangeText}
            secureTextEntry={field.secure || false}
            autoCapitalize='none'
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '80%',
    marginVertical: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: 'white',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: 'white', // Añadir color de texto blanco para los inputs
  },
});

export default AuthForm;

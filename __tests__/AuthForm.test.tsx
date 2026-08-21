import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AuthForm from '../src/components/AuthForm';

describe('AuthForm', () => {
  it('renderiza campos de login', async () => {
    const onEmail = jest.fn();
    const onPassword = jest.fn();

    await render(
      <AuthForm
        fields={[
          {
            label: 'Correo Electrónico',
            value: 'test@test.com',
            onChangeText: onEmail,
            keyboardType: 'email-address',
          },
          {
            label: 'Contraseña',
            value: 'secret',
            onChangeText: onPassword,
            secure: true,
          },
        ]}
      />
    );

    expect(screen.getByText('Correo Electrónico')).toBeTruthy();
    expect(screen.getByText('Contraseña')).toBeTruthy();
    expect(screen.getByDisplayValue('test@test.com')).toBeTruthy();
  });

  it('propaga cambios de texto', async () => {
    const onEmail = jest.fn();
    await render(
      <AuthForm
        fields={[
          {
            label: 'Email',
            value: '',
            onChangeText: onEmail,
          },
        ]}
      />
    );

    fireEvent.changeText(screen.getByDisplayValue(''), 'nuevo@test.com');
    expect(onEmail).toHaveBeenCalledWith('nuevo@test.com');
  });
});

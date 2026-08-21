import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AddTrainingModal from '../src/components/AddTrainingModal';

describe('AddTrainingModal', () => {
  it('renderiza el formulario de entrenamiento', async () => {
    await render(<AddTrainingModal visible onClose={jest.fn()} onSave={jest.fn()} />);
    expect(screen.getByText('Agregar Entrenamiento')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ej: 45')).toBeTruthy();
  });

  it('muestra error cuando la duración está vacía', async () => {
    const onSave = jest.fn();
    await render(<AddTrainingModal visible onClose={jest.fn()} onSave={onSave} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Guardar'));
    });

    expect(screen.getByText('La duración es requerida')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});

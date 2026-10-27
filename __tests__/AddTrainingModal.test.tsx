import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AddTrainingModal from '../src/components/AddTrainingModal';

describe('AddTrainingModal', () => {
  it('renderiza el formulario de entrenamiento', async () => {
    await render(<AddTrainingModal visible onClose={jest.fn()} onSave={jest.fn()} />);
    expect(screen.getByText('Nuevo entrenamiento')).toBeTruthy();
    expect(screen.getByText('Duración')).toBeTruthy();
  });

  it('llama onSave con duración por defecto', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    await render(<AddTrainingModal visible onClose={jest.fn()} onSave={onSave} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Guardar'));
    });

    expect(onSave).toHaveBeenCalled();
    expect(onSave.mock.calls[0][0].duration_min).toBe(45);
  });
});

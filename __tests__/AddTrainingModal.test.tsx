import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AddTrainingModal, {
  buildInitialTrainingData,
  diffTrainingData,
} from '../src/components/AddTrainingModal';

jest.mock('../src/services/feedback', () => ({
  notify: { info: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

const existingSession = {
  session_id: 7,
  user_id: 1,
  session_date: '2026-11-13',
  start_time: '11:50:00',
  duration_min: 45,
  intensity: 'medio',
  type: 'cardio',
  weather: 'calido',
  sport_type: '10K',
  notes: '',
} as any;

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

  it('al editar sin cambios no llama al API y cierra el formulario', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    await render(
      <AddTrainingModal
        visible
        mode="edit"
        initialSession={existingSession}
        onClose={onClose}
        onSave={onSave}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Guardar cambios'));
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('al editar envía solo los campos modificados', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    await render(
      <AddTrainingModal
        visible
        mode="edit"
        initialSession={existingSession}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText('1 h'));
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Guardar cambios'));
    });

    expect(onSave).toHaveBeenCalledWith({ duration_min: 60 });
  });

  it('traduce el clima guardado en BD al chip del formulario', () => {
    expect(buildInitialTrainingData(existingSession).weather).toBe('soleado');
    expect(diffTrainingData({ a: 1, b: 'x' }, { a: 1, b: 'y' })).toEqual({ b: 'y' });
  });
});

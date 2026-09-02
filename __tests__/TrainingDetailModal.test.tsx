import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TrainingDetailModal from '../src/components/TrainingDetailModal';

jest.mock('../src/services/api', () => ({
  saveProductFeedback: jest.fn(async () => ({ success: true })),
  getTrainingRecommendations: jest.fn(async () => ({ data: [] })),
  unwrapApiPayload: (payload: unknown) => payload,
}));

describe('TrainingDetailModal', () => {
  const session = {
    session_id: 1,
    session_date: '2026-08-21',
    start_time: '08:00:00',
    duration_min: 60,
    intensity: 'medio',
    type: 'entrenamiento',
    weather: 'moderado',
    sport_type: '10K',
    notes: '',
  };

  it('renderiza recomendaciones precargadas', async () => {
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={[
          {
            product_id: 1,
            product_name: 'Gel Test',
            consumption_timing: 'durante',
          } as any,
        ]}
        prefetchedRecommendationsLoading={false}
      />
    );

    expect(screen.getByText('Productos Recomendados')).toBeTruthy();
    expect(screen.getByText('Gel Test')).toBeTruthy();
  });

  it('renderiza botones Bueno y Malo', async () => {
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={[
          {
            product_id: 1,
            product_name: 'Gel Test',
            consumption_timing: 'durante',
          } as any,
        ]}
        prefetchedRecommendationsLoading={false}
      />
    );

    expect(screen.getByText('Bueno')).toBeTruthy();
    expect(screen.getByText('Malo')).toBeTruthy();
  });

  it('muestra estado de carga', async () => {
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={[]}
        prefetchedRecommendationsLoading
      />
    );

    expect(screen.getByText('Analizando tu entrenamiento...')).toBeTruthy();
  });
});

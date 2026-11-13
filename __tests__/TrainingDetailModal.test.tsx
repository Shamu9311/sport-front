import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import TrainingDetailModal, { getRecommendationReason } from '../src/components/TrainingDetailModal';
import { getUserFeedbackHistory } from '../src/services/api';

jest.mock('../src/services/api', () => ({
  saveProductFeedback: jest.fn(async () => ({ success: true })),
  getTrainingRecommendations: jest.fn(async () => ({ data: [] })),
  getUserFeedbackHistory: jest.fn(async () => ({
    success: true,
    feedback: [{ product_id: 1, feedback: 'positivo' }],
  })),
  unwrapApiPayload: (payload: unknown) => payload,
}));

describe('TrainingDetailModal', () => {
  // Sesión pasada (ya terminada) → se puede calificar
  const session = {
    session_id: 1,
    user_id: 1,
    session_date: '2026-08-21',
    start_time: '08:00:00',
    duration_min: 60,
    intensity: 'medio',
    type: 'entrenamiento',
    weather: 'calido',
    sport_type: '10K',
    notes: '',
  } as any;

  const recs = [
    {
      product_id: 1,
      product_name: 'Gel Test',
      consumption_timing: 'durante',
      feedback: null,
      feedback_notes: 'Aporta carbohidratos de rápida absorción. | Estrategia general del entrenamiento',
    } as any,
  ];

  it('renderiza recomendaciones precargadas', async () => {
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={recs}
        prefetchedRecommendationsLoading={false}
      />
    );

    expect(screen.getByText('Productos Recomendados')).toBeTruthy();
    expect(screen.getByText('Gel Test')).toBeTruthy();
  });

  it('muestra el porqué de la recomendación (feedback_notes, sin la estrategia general)', async () => {
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={recs}
        prefetchedRecommendationsLoading={false}
      />
    );

    expect(screen.getByText('Por qué te lo recomendamos')).toBeTruthy();
    expect(screen.getByText('Aporta carbohidratos de rápida absorción.')).toBeTruthy();
    expect(getRecommendationReason({ feedback_notes: '' })).toBe('');
  });

  it('muestra el clima con la etiqueta del formulario', async () => {
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={recs}
        prefetchedRecommendationsLoading={false}
      />
    );
    expect(screen.getByText('Soleado')).toBeTruthy();
  });

  it('renderiza botones Bueno y Malo en una sesión ya realizada y carga el feedback guardado', async () => {
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={recs}
        prefetchedRecommendationsLoading={false}
      />
    );

    expect(screen.getByText('Bueno')).toBeTruthy();
    expect(screen.getByText('Malo')).toBeTruthy();
    await waitFor(() => expect(getUserFeedbackHistory).toHaveBeenCalled());
  });

  it('en una sesión futura no pide calificar todavía', async () => {
    const future = { ...session, session_date: '2099-01-01' };
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={future}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={recs}
        prefetchedRecommendationsLoading={false}
      />
    );

    expect(screen.queryByText('Bueno')).toBeNull();
    expect(screen.getByText('Podrás calificarlo después de tu entrenamiento.')).toBeTruthy();
  });

  it('muestra el esqueleto de las 4 fases mientras se generan', async () => {
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
    ['Antes', 'Durante', 'Después', 'Diario'].forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  it('separa Editar del botón volver', async () => {
    const onEdit = jest.fn();
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        onEdit={onEdit}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={recs}
        prefetchedRecommendationsLoading={false}
      />
    );
    expect(screen.getByText('Editar')).toBeTruthy();
    expect(screen.getByLabelText('Volver a entrenamientos')).toBeTruthy();
  });
});

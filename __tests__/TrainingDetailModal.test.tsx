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

  it('muestra un esqueleto genérico mientras se generan (sin asumir 4 fases)', async () => {
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
    expect(screen.getAllByTestId('recommendation-skeleton-card').length).toBe(2);
    ['Antes', 'Durante', 'Después', 'Diario'].forEach((label) => {
      expect(screen.queryByText(label)).toBeNull();
    });
  });

  it('muestra un número variable de recomendaciones y su sección "Evidencia" sin datos técnicos', async () => {
    const evidenceRecs = [
      {
        recommendation_id: 21, product_id: 25, product_name: 'BETA Fuel 40g Gel Orange', consumption_timing: 'durante',
        recommended_quantity: '0.8–1.5 porciones/h', feedback_notes: 'Respaldado por la guía.',
        evidence_mode: 'evidence_rag', cadence_status: 'cadence_verified',
        evidence_note: 'Evidencia del ingrediente, no del producto específico.',
        evidence: [
          { source_id: 7, title: 'AIS Sports Gels', year: null, source_type: 'guideline', summary: '30–60 g/h durante 1–2.5 h.', doi: null, url: 'https://www.ais.gov.au/gels', role: 'supports' },
          { source_id: 7, title: 'AIS Sports Gels', year: null, source_type: 'guideline', summary: 'Geles antes del ejercicio.', doi: null, url: 'https://www.ais.gov.au/gels', role: 'supports' },
          { source_id: 9, title: 'Ficha BETA Fuel Gel', year: null, source_type: 'manufacturer_specification', summary: 'Uso durante el ejercicio.', doi: null, url: null, role: 'usage_constraint' },
        ],
      },
    ] as any[];
    await render(
      <TrainingDetailModal
        visible
        onClose={jest.fn()}
        session={session}
        userId={1}
        usePrefetchedRecommendations
        prefetchedRecommendations={evidenceRecs}
        prefetchedRecommendationsLoading={false}
      />
    );

    expect(screen.getAllByTestId('recommendation-evidence')).toHaveLength(1);
    expect(screen.getByText('Evidencia')).toBeTruthy();
    expect(screen.getAllByText('AIS Sports Gels')).toHaveLength(1); // agrupada por fuente
    expect(screen.getByText('Guía · Respalda')).toBeTruthy();
    expect(screen.getByText(/Instrucción del fabricante \(no es evidencia de eficacia\)/)).toBeTruthy();
    expect(screen.getByText('Evidencia del ingrediente, no del producto específico.')).toBeTruthy();
    expect(screen.queryByText(/similarity|embedding/i)).toBeNull();
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

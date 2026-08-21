import { getSavedRecommendations, getUserFeedbackHistory } from '../src/services/api';

jest.mock('../src/services/api', () => ({
  getSavedRecommendations: jest.fn(async () => ({
    data: [{ product_id: 1, product_name: 'Gel positivo', feedback: 'positivo' }],
  })),
  getUserFeedbackHistory: jest.fn(async () => ({
    data: [{ product_id: 2, product_name: 'Bar negativo', feedback: 'negativo' }],
  })),
}));

describe('historial de recomendaciones (datos API)', () => {
  it('obtiene listas positivas y negativas desde API mockeada', async () => {
    const saved = await getSavedRecommendations();
    const feedback = await getUserFeedbackHistory(1);

    expect(saved.data).toHaveLength(1);
    expect(feedback.data).toHaveLength(1);
    expect(saved.data[0].feedback).toBe('positivo');
    expect(feedback.data[0].feedback).toBe('negativo');
  });
});

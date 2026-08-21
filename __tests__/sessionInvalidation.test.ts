import { notifySessionInvalidated, setSessionInvalidatedHandler } from '../src/services/sessionInvalidation';

describe('sessionInvalidation', () => {
  it('ejecuta handler cuando la sesión se invalida', async () => {
    const handler = jest.fn();
    setSessionInvalidatedHandler(handler);
    notifySessionInvalidated();
    expect(handler).toHaveBeenCalled();
    setSessionInvalidatedHandler(null);
  });
});

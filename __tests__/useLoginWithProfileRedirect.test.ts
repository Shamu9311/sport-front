import { isValidEmail } from '../src/utils/validation';

jest.mock('../src/services/api', () => ({
  loginUser: jest.fn(),
}));

import { loginUser } from '../src/services/api';

async function runSubmitLogin(
  payload: {
    email: string;
    password: string;
    onMissingFields: jest.Mock;
    onInvalidEmail: jest.Mock;
    onIncompleteUser: jest.Mock;
    onError: jest.Mock;
  },
  loginFn: (email: string, password: string) => Promise<unknown>
) {
  const { email, password, onMissingFields, onInvalidEmail, onIncompleteUser, onError } = payload;

  if (!email || !password) {
    onMissingFields();
    return;
  }
  if (!isValidEmail(email)) {
    onInvalidEmail();
    return;
  }

  try {
    const response: any = await loginFn(email, password);
    if (response?.user && response?.token) {
      if (!response.user.id) {
        onIncompleteUser();
      }
    } else {
      onIncompleteUser();
    }
  } catch (error: any) {
    if (error.status === 401) {
      onError('Usuario o contraseña incorrectos.');
    } else {
      onError(error.message || 'Error');
    }
  }
}

describe('validación de login (lógica del hook)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('dispara onMissingFields cuando faltan datos', async () => {
    const onMissingFields = jest.fn();
    await runSubmitLogin(
      {
        email: '',
        password: '',
        onMissingFields,
        onInvalidEmail: jest.fn(),
        onIncompleteUser: jest.fn(),
        onError: jest.fn(),
      },
      loginUser as jest.Mock
    );
    expect(onMissingFields).toHaveBeenCalled();
  });

  it('dispara onInvalidEmail con email inválido', async () => {
    const onInvalidEmail = jest.fn();
    await runSubmitLogin(
      {
        email: 'invalid',
        password: '123',
        onMissingFields: jest.fn(),
        onInvalidEmail,
        onIncompleteUser: jest.fn(),
        onError: jest.fn(),
      },
      loginUser as jest.Mock
    );
    expect(onInvalidEmail).toHaveBeenCalled();
  });

  it('maneja error 401 de API', async () => {
    (loginUser as jest.Mock).mockRejectedValue({ status: 401 });
    const onError = jest.fn();
    await runSubmitLogin(
      {
        email: 'user@test.com',
        password: 'bad',
        onMissingFields: jest.fn(),
        onInvalidEmail: jest.fn(),
        onIncompleteUser: jest.fn(),
        onError,
      },
      loginUser as jest.Mock
    );
    expect(onError).toHaveBeenCalledWith('Usuario o contraseña incorrectos.');
  });
});

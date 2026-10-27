import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-reanimated', () => {
  const { Image, Pressable, Text, View } = require('react-native');
  const chain = new Proxy(() => chain, {
    get: () => chain,
    apply: () => chain,
  });
  const Animated = {
    View,
    Text,
    Image,
    createAnimatedComponent: (Component) => Component || Pressable,
  };

  return {
    __esModule: true,
    default: Animated,
    FadeIn: chain,
    FadeOut: chain,
    FadeInDown: chain,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    interpolate: (value) => value,
    useAnimatedStyle: (updater) => updater(),
    useAnimatedProps: (updater) => updater(),
    useSharedValue: (value) => ({ value }),
    useReducedMotion: () => false,
    withTiming: (value) => value,
    withSpring: (value) => value,
    withDelay: (_delay, value) => value,
    runOnJS: (fn) => fn,
    Easing: chain,
  };
});

jest.mock('expo-font', () => {
  const actual = jest.requireActual('expo-font');
  return {
    ...actual,
    loadAsync: jest.fn(() => Promise.resolve()),
    isLoaded: jest.fn(() => true),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useSegments: () => [],
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('expo', () => ({ isRunningInExpoGo: jest.fn() }));
jest.mock('expo-notifications', () => {
  throw new Error('Expo Go must not load the native notifications module');
});

it.each(['ios', 'android'])('does not load native push code in Expo Go on %s', platform => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo').isRunningInExpoGo.mockReturnValue(true);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native').Platform.OS = platform;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(require('./native-notifications').nativeNotifications).toBeNull();
  });
});

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/hooks/use-session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <SessionProvider>
      <ThemeProvider
        value={{
          ...base,
          colors: {
            ...base.colors,
            primary: colors.accent,
            background: colors.background,
            card: colors.backgroundElement,
            text: colors.text,
            border: colors.border,
          },
        }}>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </ThemeProvider>
    </SessionProvider>
  );
}

function RootNavigator() {
  const { status, isSignedIn } = useSession();

  // Restoring the stored session takes a moment; the splash overlay covers it.
  if (status === 'loading') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="page/[id]" />
        <Stack.Screen name="book/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
    </Stack>
  );
}

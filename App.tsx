/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import StorybookUI from './.rnstorybook';
import ModalDemo from './components/ModalDemo';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme, darkTheme } from './theme';
import { ThemeProvider as AppThemeProvider, useTheme } from './context/ThemeContext';

function Root() {
  const { isDarkMode } = useTheme();
  const isStorybook = process.env.STORYBOOK_ENABLED === 'true';

  const content = isStorybook ? <StorybookUI /> : <AppContent />;

  return (
    <KeyboardProvider navigationBarTranslucent statusBarTranslucent>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <SafeAreaProvider>
          <StatusBar translucent barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" />
          {content}
        </SafeAreaProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <Root />
    </AppThemeProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      {/* Fake Status Bar */}
      <View style={{ height: insets.top, backgroundColor: 'red', width: '100%' }} />
      <ModalDemo />
      {/* Fake Navigation Bar */}
      {/* <View style={{ height: insets.bottom, backgroundColor: 'blue', width: '100%' }} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

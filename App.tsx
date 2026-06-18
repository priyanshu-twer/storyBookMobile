/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import StorybookUI from './.rnstorybook';
import ModalDemo from './components/ModalDemo';
import { KeyboardProvider } from 'react-native-keyboard-controller';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
const isStorybook = process.env.STORYBOOK_ENABLED === 'true';
 if (isStorybook) {
   return <StorybookUI />;
 }
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <View style={styles.container}>
        <ModalDemo />
      </View>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

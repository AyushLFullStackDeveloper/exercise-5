import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme/ThemeContext';
import { Platform } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    const url = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
    fetch(url)
      .then(res => res.text())
      .then(data => console.log('TEST API CONNECTIVITY SUCCESS:', data))
      .catch(err => console.log('TEST API CONNECTIVITY ERROR:', err));
  }, []);

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
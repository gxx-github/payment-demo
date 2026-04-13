import React from 'react';
import { StatusBar } from 'react-native';
import { RootNavigator } from './navigation/RootNavigator';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { Colors } from './styles/colors';

const App: React.FC = () => {
  return (
    <WebSocketProvider>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <RootNavigator />
    </WebSocketProvider>
  );
};

export default App;


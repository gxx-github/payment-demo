import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { Buffer } from 'buffer';

// 在Web环境中设置全局Buffer
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = Buffer;
}

// 导入页面组件
import HomeScreen from './src/screens/HomeScreen';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import ImportWalletScreen from './src/screens/ImportWalletScreen';
import WalletDetailScreen from './src/screens/WalletDetailScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Crypto Wallet' }}
          />
          <Stack.Screen 
            name="CreateWallet" 
            component={CreateWalletScreen} 
            options={{ title: '创建钱包' }}
          />
          <Stack.Screen 
            name="ImportWallet" 
            component={ImportWalletScreen} 
            options={{ title: '导入钱包' }}
          />
          <Stack.Screen 
            name="WalletDetail" 
            component={WalletDetailScreen} 
            options={{ title: '钱包详情' }}
          />
          <Stack.Screen 
            name="Send" 
            component={SendScreen} 
            options={{ title: '发送USDC' }}
          />
          <Stack.Screen 
            name="Receive" 
            component={ReceiveScreen} 
            options={{ title: '接收USDC' }}
          />
          <Stack.Screen 
            name="QRScanner" 
            component={QRScannerScreen} 
            options={{ title: '扫描二维码' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
      <Toast />
    </>
  );
}

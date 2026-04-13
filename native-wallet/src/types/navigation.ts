import { NavigationProp, RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  CreateWallet: undefined;
  ImportWallet: undefined;
  BackupMnemonic: { mnemonic: string };
  MainTabs: undefined;
  TransactionDetail: { transactionId: string };
  SendToken: { chainId: number | string };
  ReceiveToken: undefined;
  Settings: undefined;
  ChainSelector: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Wallet: undefined;
  QRCode: undefined;
  History: undefined;
};

export type RootStackNavigationProp = NavigationProp<RootStackParamList>;
export type MainTabNavigationProp = NavigationProp<MainTabParamList>;

export type WelcomeScreenRouteProp = RouteProp<RootStackParamList, 'Welcome'>;
export type BackupMnemonicRouteProp = RouteProp<RootStackParamList, 'BackupMnemonic'>;


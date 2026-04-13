import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { Button } from '../components/Button';
import { Colors } from '../styles/colors';
import { hasWallet } from '../utils/walletManager';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      const walletExists = await hasWallet();
      if (walletExists) {
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>💳</Text>
          </View>
          <Text style={styles.title}>Native Wallet</Text>
          <Text style={styles.subtitle}>
            安全的多链加密货币钱包
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="🔐"
            title="安全可靠"
            description="本地存储私钥，完全控制您的资产"
          />
          <FeatureItem
            icon="🌐"
            title="多链支持"
            description="支持 Ethereum、BSC、Polygon、Solana 等"
          />
          <FeatureItem
            icon="💰"
            title="支付便捷"
            description="扫码支付，快速完成交易"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="创建新钱包"
            onPress={() => navigation.navigate('CreateWallet')}
          />
          <Button
            title="导入已有钱包"
            onPress={() => navigation.navigate('ImportWallet')}
            variant="outline"
            style={styles.importButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  features: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    gap: 12,
  },
  importButton: {
    marginTop: 8,
  },
});


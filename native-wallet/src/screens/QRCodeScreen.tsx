import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../styles/colors';
import { getCurrentWallet } from '../utils/walletManager';
import { generatePaymentQRString } from '../utils/qrcode';

export const QRCodeScreen: React.FC = () => {
  const [qrData, setQrData] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [chainName, setChainName] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const wallet = await getCurrentWallet();
      if (!wallet) {
        Alert.alert('错误', '未找到钱包');
        return;
      }

      setWalletAddress(wallet.address);
      setChainName(wallet.chainName);

      const paymentData = generatePaymentQRString({
        walletAddress: wallet.address,
        chainId: wallet.chainId,
        timestamp: Date.now(),
      });

      setQrData(paymentData);
    } catch (error) {
      console.error('Error loading wallet:', error);
      Alert.alert('错误', '加载钱包失败');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>收款二维码</Text>
          <Text style={styles.subtitle}>
            请商家使用 POS 机扫描此二维码完成支付
          </Text>
        </View>

        <View style={styles.qrContainer}>
          {qrData ? (
            <QRCode
              value={qrData}
              size={250}
              backgroundColor={Colors.surface}
              color={Colors.text}
            />
          ) : (
            <Text style={styles.loadingText}>加载中...</Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>网络：</Text>
            <Text style={styles.infoValue}>{chainName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>地址：</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
              {walletAddress}
            </Text>
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 使用说明</Text>
          <Text style={styles.tipsText}>
            1. 确保您的钱包有足够的余额{'\n'}
            2. 向商家展示此二维码{'\n'}
            3. 等待商家扫描并输入金额{'\n'}
            4. 确认交易信息后完成支付
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ 请勿向不信任的第三方展示此二维码
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: Colors.surface,
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  warningBox: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  warningText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
  },
});


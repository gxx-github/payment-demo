import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Colors } from '../styles/colors';
import { createMultiChainWallets } from '../utils/walletManager';
import { getMainnetChains } from '../config/chains';
import * as bip39 from 'bip39';

export const ImportWalletScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImportWallet = async () => {
    try {
      setError('');
      
      // 验证助记词
      const trimmedMnemonic = mnemonic.trim().toLowerCase();
      if (!bip39.validateMnemonic(trimmedMnemonic)) {
        setError('无效的助记词，请检查后重试');
        return;
      }

      setLoading(true);
      
      // 为主要链创建钱包
      const mainChains = getMainnetChains().slice(0, 3); // ETH, BSC, Solana
      const chainConfigs = mainChains.map(chain => ({
        chainId: chain.chainId,
        chainName: chain.name,
        chainType: chain.type,
      }));
      
      await createMultiChainWallets(trimmedMnemonic, chainConfigs);
      
      Alert.alert('成功', '钱包导入成功', [
        {
          text: '确定',
          onPress: () => navigation.replace('MainTabs'),
        },
      ]);
    } catch (error) {
      console.error('Error importing wallet:', error);
      Alert.alert('错误', '导入钱包失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>导入钱包</Text>
          <Text style={styles.subtitle}>
            输入您的 12 个助记词来恢复钱包
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Input
            label="助记词"
            placeholder="输入 12 个助记词，用空格分隔"
            value={mnemonic}
            onChangeText={text => {
              setMnemonic(text);
              setError('');
            }}
            multiline
            numberOfLines={4}
            error={error}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            提示：助记词是由 12 个英文单词组成，请按顺序输入
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>🔒 安全提示</Text>
          <Text style={styles.warningText}>
            • 请确保在安全的环境中输入助记词{'\n'}
            • 切勿在公共场所或他人面前输入{'\n'}
            • Native Wallet 不会保存或上传您的助记词
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="导入钱包"
          onPress={handleImportWallet}
          loading={loading}
          disabled={!mnemonic.trim()}
        />
        <Button
          title="返回"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
          disabled={loading}
        />
      </View>
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
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 24,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  warningBox: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    gap: 12,
  },
  backButton: {
    marginTop: 8,
  },
});


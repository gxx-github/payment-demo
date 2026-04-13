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
import { Colors } from '../styles/colors';
import { createMultiChainWallets, generateMnemonic } from '../utils/walletManager';
import { getMainnetChains } from '../config/chains';

export const CreateWalletScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      
      // 生成助记词
      const mnemonic = generateMnemonic();
      
      // 为主要链创建钱包
      const mainChains = getMainnetChains().slice(0, 3); // ETH, BSC, Solana
      const chainConfigs = mainChains.map(chain => ({
        chainId: chain.chainId,
        chainName: chain.name,
        chainType: chain.type,
      }));
      
      await createMultiChainWallets(mnemonic, chainConfigs);
      
      // 导航到备份助记词页面
      navigation.navigate('BackupMnemonic', { mnemonic });
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('错误', '创建钱包失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>创建新钱包</Text>
          <Text style={styles.subtitle}>
            系统将为您生成一个新的钱包和助记词
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <InfoItem
            icon="🔑"
            title="生成助记词"
            description="12 个单词组成的助记词是恢复钱包的唯一方式"
          />
          <InfoItem
            icon="💾"
            title="安全备份"
            description="请务必将助记词抄写并保存在安全的地方"
          />
          <InfoItem
            icon="⚠️"
            title="切勿泄露"
            description="任何人获得助记词都可以控制您的资产"
          />
          <InfoItem
            icon="🌐"
            title="多链支持"
            description="一个助记词可管理多条区块链上的资产"
          />
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ 重要提示</Text>
          <Text style={styles.warningText}>
            • 助记词是恢复钱包的唯一方式{'\n'}
            • 请勿截图或通过网络传输{'\n'}
            • 丢失助记词将永久失去钱包资产{'\n'}
            • 请妥善保管，Native Wallet 不会保存您的助记词
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="创建钱包"
          onPress={handleCreateWallet}
          loading={loading}
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

interface InfoItemProps {
  icon: string;
  title: string;
  description: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, title, description }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoText}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDescription}>{description}</Text>
    </View>
  </View>
);

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
  infoContainer: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
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


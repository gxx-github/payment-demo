import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, LoadingSpinner, Alert as CustomAlert, QRCode } from '../components';
import WalletService from '../services/WalletService';
import QRService from '../services/QRService';
import { formatAddress, formatAmount, formatTime } from '../utils/helpers';
import { UI_CONFIG } from '../utils/constants';

const WalletDetailScreen = ({ navigation }) => {
  const [walletData, setWalletData] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const wallet = await WalletService.getCurrentWallet();
      
      if (wallet) {
        setWalletData(wallet);
        // 加载余额信息
        await loadBalances(wallet.address);
      } else {
        showErrorAlert('未找到钱包数据');
        navigation.goBack();
      }
    } catch (error) {
      console.error('加载钱包数据失败:', error);
      showErrorAlert('加载钱包数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async (address) => {
    try {
      // 加载ETH余额
      const ethBalance = await WalletService.getWalletBalance(address);
      setBalance(ethBalance);
      
      // 加载USDC余额
      const usdcBalance = await WalletService.getUSDCBalance(address);
      setUsdcBalance(usdcBalance);
    } catch (error) {
      console.error('加载余额失败:', error);
      // 不显示错误，因为可能是网络问题
    }
  };

  const handleCopyAddress = async () => {
    try {
      await QRService.copyToClipboard(walletData.address, '钱包地址');
    } catch (error) {
      console.error('复制地址失败:', error);
      showErrorAlert('复制地址失败');
    }
  };

  const handleCopyPrivateKey = async () => {
    try {
      await QRService.copyToClipboard(walletData.privateKey, '私钥');
    } catch (error) {
      console.error('复制私钥失败:', error);
      showErrorAlert('复制私钥失败');
    }
  };

  const handleCopyMnemonic = async () => {
    try {
      if (walletData.mnemonic) {
        await QRService.copyToClipboard(walletData.mnemonic, '助记词');
      } else {
        showErrorAlert('此钱包没有助记词（通过私钥导入）');
      }
    } catch (error) {
      console.error('复制助记词失败:', error);
      showErrorAlert('复制助记词失败');
    }
  };

  const handleShowPrivateKey = () => {
    Alert.alert(
      '显示私钥',
      '私钥是您钱包的最高权限，请确保周围没有其他人，不要截图或分享给他人。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => setShowPrivateKey(true)
        }
      ]
    );
  };

  const handleShowMnemonic = () => {
    if (!walletData.mnemonic) {
      showErrorAlert('此钱包没有助记词（通过私钥导入）');
      return;
    }
    
    Alert.alert(
      '显示助记词',
      '助记词是恢复钱包的重要信息，请确保周围没有其他人，不要截图或分享给他人。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => setShowMnemonic(true)
        }
      ]
    );
  };

  const handleExportWallet = () => {
    Alert.alert(
      '导出钱包',
      '选择导出方式：',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '导出私钥',
          onPress: () => {
            setShowPrivateKey(true);
          }
        },
        {
          text: '导出助记词',
          onPress: () => {
            if (walletData.mnemonic) {
              setShowMnemonic(true);
            } else {
              showErrorAlert('此钱包没有助记词');
            }
          }
        }
      ]
    );
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      '删除钱包',
      '删除钱包将清除所有本地数据，请确保您已备份私钥或助记词。此操作不可撤销！',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await WalletService.deleteWallet();
              showSuccessAlert('钱包已删除', () => {
                navigation.navigate('Home');
              });
            } catch (error) {
              console.error('删除钱包失败:', error);
              showErrorAlert('删除钱包失败');
            }
          }
        }
      ]
    );
  };

  const showErrorAlert = (message) => {
    setAlertConfig({
      title: '错误',
      message,
      type: 'error',
      onConfirm: () => setShowAlert(false)
    });
    setShowAlert(true);
  };

  const showSuccessAlert = (message, onConfirm) => {
    setAlertConfig({
      title: '成功',
      message,
      type: 'success',
      onConfirm: onConfirm || (() => setShowAlert(false))
    });
    setShowAlert(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner visible={true} text="加载中..." />
      </SafeAreaView>
    );
  }

  if (!walletData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>未找到钱包数据</Text>
          <Button
            title="返回首页"
            onPress={() => navigation.navigate('Home')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 钱包地址卡片 */}
        <Card style={styles.addressCard}>
          <Text style={styles.cardTitle}>钱包地址</Text>
          <Text style={styles.addressText}>
            {formatAddress(walletData.address, 8, 8)}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyAddress}
          >
            <Text style={styles.copyButtonText}>📋 复制地址</Text>
          </TouchableOpacity>
        </Card>

        {/* 二维码卡片 */}
        <Card style={styles.qrCard}>
          <Text style={styles.cardTitle}>钱包二维码</Text>
          <QRCode
            value={walletData.address}
            size={200}
            style={styles.qrCode}
          />
        </Card>

        {/* 余额信息 */}
        <Card style={styles.balanceCard}>
          <Text style={styles.cardTitle}>余额信息</Text>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>ETH 余额</Text>
            <Text style={styles.balanceAmount}>
              {formatAmount(balance, 4, 'ETH')}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>USDC 余额</Text>
            <Text style={styles.balanceAmount}>
              {formatAmount(usdcBalance, 2, 'USDC')}
            </Text>
          </View>
        </Card>

        {/* 钱包信息 */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>钱包信息</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>创建时间</Text>
            <Text style={styles.infoValue}>
              {formatTime(walletData.createdAt)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>钱包类型</Text>
            <Text style={styles.infoValue}>
              {walletData.mnemonic ? '助记词钱包' : '私钥钱包'}
            </Text>
          </View>
        </Card>

        {/* 私钥信息 */}
        {showPrivateKey && (
          <Card style={styles.privateKeyCard}>
            <Text style={styles.cardTitle}>私钥</Text>
            <Text style={styles.privateKeyText}>
              {walletData.privateKey}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyPrivateKey}
            >
              <Text style={styles.copyButtonText}>📋 复制私钥</Text>
            </TouchableOpacity>
            <Button
              title="隐藏私钥"
              onPress={() => setShowPrivateKey(false)}
              variant="outline"
              style={styles.hideButton}
            />
          </Card>
        )}

        {/* 助记词信息 */}
        {showMnemonic && walletData.mnemonic && (
          <Card style={styles.mnemonicCard}>
            <Text style={styles.cardTitle}>助记词</Text>
            <Text style={styles.mnemonicText}>
              {walletData.mnemonic}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyMnemonic}
            >
              <Text style={styles.copyButtonText}>📋 复制助记词</Text>
            </TouchableOpacity>
            <Button
              title="隐藏助记词"
              onPress={() => setShowMnemonic(false)}
              variant="outline"
              style={styles.hideButton}
            />
          </Card>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionContainer}>
          <Button
            title="显示私钥"
            onPress={handleShowPrivateKey}
            variant="outline"
            icon="🔐"
            style={styles.actionButton}
          />
          {walletData.mnemonic && (
            <Button
              title="显示助记词"
              onPress={handleShowMnemonic}
              variant="outline"
              icon="🔑"
              style={styles.actionButton}
            />
          )}
        </View>

        <View style={styles.actionContainer}>
          <Button
            title="导出钱包"
            onPress={handleExportWallet}
            variant="outline"
            icon="📤"
            style={styles.actionButton}
          />
          <Button
            title="删除钱包"
            onPress={handleDeleteWallet}
            variant="danger"
            icon="🗑️"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
      
      <CustomAlert
        visible={showAlert}
        {...alertConfig}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: UI_CONFIG.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.xl,
  },
  errorText: {
    fontSize: UI_CONFIG.fontSize.lg,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  addressCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  qrCard: {
    marginBottom: UI_CONFIG.spacing.lg,
    alignItems: 'center',
  },
  balanceCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  infoCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  privateKeyCard: {
    marginBottom: UI_CONFIG.spacing.lg,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  mnemonicCard: {
    marginBottom: UI_CONFIG.spacing.lg,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  cardTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
  },
  addressText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  qrCode: {
    marginVertical: UI_CONFIG.spacing.md,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  balanceLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  infoLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
  },
  infoValue: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
  },
  privateKeyText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.text,
    fontFamily: 'monospace',
    backgroundColor: UI_CONFIG.colors.background,
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.sm,
    marginBottom: UI_CONFIG.spacing.md,
  },
  mnemonicText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    fontFamily: 'monospace',
    backgroundColor: UI_CONFIG.colors.background,
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.sm,
    marginBottom: UI_CONFIG.spacing.md,
    lineHeight: 24,
  },
  copyButton: {
    alignItems: 'center',
    padding: UI_CONFIG.spacing.sm,
    marginBottom: UI_CONFIG.spacing.md,
  },
  copyButtonText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.primary,
    fontWeight: '500',
  },
  hideButton: {
    marginTop: UI_CONFIG.spacing.sm,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.sm,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});

export default WalletDetailScreen;

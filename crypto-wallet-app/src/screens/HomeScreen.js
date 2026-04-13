import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, LoadingSpinner, Alert as CustomAlert } from '../components';
import WalletService from '../services/WalletService';
import TransactionService from '../services/TransactionService';
import { formatAddress, formatAmount, formatTime } from '../utils/helpers';
import { UI_CONFIG, SUPPORTED_CURRENCIES } from '../utils/constants';

const HomeScreen = ({ navigation }) => {
  const [walletData, setWalletData] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
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

  const handleCreateWallet = () => {
    navigation.navigate('CreateWallet');
  };

  const handleImportWallet = () => {
    navigation.navigate('ImportWallet');
  };

  const handleSend = () => {
    if (!walletData) {
      showErrorAlert('请先创建或导入钱包');
      return;
    }
    navigation.navigate('Send');
  };

  const handleReceive = () => {
    if (!walletData) {
      showErrorAlert('请先创建或导入钱包');
      return;
    }
    navigation.navigate('Receive');
  };

  const handleWalletDetail = () => {
    if (!walletData) {
      showErrorAlert('请先创建或导入钱包');
      return;
    }
    navigation.navigate('WalletDetail');
  };

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前钱包吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await WalletService.deleteWallet();
              setWalletData(null);
              setBalance('0.00');
              setUsdcBalance('0.00');
            } catch (error) {
              console.error('退出登录失败:', error);
              showErrorAlert('退出登录失败');
            }
          }
        }
      ]
    );
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
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>欢迎使用 Crypto Wallet</Text>
          <Text style={styles.welcomeSubtitle}>
            安全、便捷的加密货币钱包
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="创建新钱包"
              onPress={handleCreateWallet}
              style={styles.button}
            />
            <Button
              title="导入钱包"
              onPress={handleImportWallet}
              variant="outline"
              style={styles.button}
            />
          </View>
        </View>
        
        <CustomAlert
          visible={showAlert}
          {...alertConfig}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 钱包信息卡片 */}
        <Card style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletTitle}>我的钱包</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>退出</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>钱包地址</Text>
            <Text style={styles.addressText}>
              {formatAddress(walletData.address)}
            </Text>
          </View>
          
          <View style={styles.balanceContainer}>
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
          </View>
        </Card>

        {/* 操作按钮 */}
        <View style={styles.actionContainer}>
          <Button
            title="发送"
            onPress={handleSend}
            icon="📤"
            style={styles.actionButton}
          />
          <Button
            title="接收"
            onPress={handleReceive}
            icon="📥"
            variant="outline"
            style={styles.actionButton}
          />
        </View>

        {/* 快速操作 */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>快速操作</Text>
          
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={handleWalletDetail}
          >
            <Text style={styles.quickActionIcon}>👛</Text>
            <Text style={styles.quickActionText}>钱包详情</Text>
            <Text style={styles.quickActionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Text style={styles.quickActionIcon}>📷</Text>
            <Text style={styles.quickActionText}>扫描二维码</Text>
            <Text style={styles.quickActionArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* 最近交易 */}
        <Card style={styles.transactionCard}>
          <Text style={styles.sectionTitle}>最近交易</Text>
          <Text style={styles.emptyText}>暂无交易记录</Text>
        </Card>
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
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.xl,
  },
  welcomeTitle: {
    fontSize: UI_CONFIG.fontSize.xxl,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  welcomeSubtitle: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: UI_CONFIG.spacing.md,
  },
  button: {
    marginBottom: UI_CONFIG.spacing.sm,
  },
  walletCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  walletTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
  },
  logoutText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.error,
  },
  addressContainer: {
    marginBottom: UI_CONFIG.spacing.md,
  },
  addressLabel: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  addressText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    fontFamily: 'monospace',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  balanceAmount: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  quickActionsCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  sectionTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: UI_CONFIG.spacing.md,
  },
  quickActionText: {
    flex: 1,
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
  },
  quickActionArrow: {
    fontSize: 18,
    color: UI_CONFIG.colors.textSecondary,
  },
  transactionCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  emptyText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: UI_CONFIG.spacing.lg,
  },
});

export default HomeScreen;

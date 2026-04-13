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
import { Button, Input, Card, LoadingSpinner, Alert as CustomAlert } from '../components';
import WalletService from '../services/WalletService';
import TransactionService from '../services/TransactionService';
import QRService from '../services/QRService';
import { formatAmount, isValidAddress } from '../utils/helpers';
import { UI_CONFIG, SUPPORTED_CURRENCIES } from '../utils/constants';

const SendScreen = ({ navigation, route }) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [currency, setCurrency] = useState('USDC');
  const [network, setNetwork] = useState('ethereum');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [errors, setErrors] = useState({});
  const [gasEstimate, setGasEstimate] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [balance, setBalance] = useState('0.00');

  // 从路由参数获取预填充数据
  useEffect(() => {
    if (route.params) {
      if (route.params.toAddress) {
        setToAddress(route.params.toAddress);
      }
      if (route.params.amount) {
        setAmount(route.params.amount);
      }
      if (route.params.currency) {
        setCurrency(route.params.currency);
      }
    }
  }, [route.params]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const wallet = await WalletService.getCurrentWallet();
      if (wallet) {
        setWalletData(wallet);
        // 加载余额
        const walletBalance = await WalletService.getUSDCBalance(wallet.address);
        setBalance(walletBalance);
      } else {
        showErrorAlert('请先创建或导入钱包');
        navigation.goBack();
      }
    } catch (error) {
      console.error('加载钱包数据失败:', error);
      showErrorAlert('加载钱包数据失败');
    }
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner', {
      onScan: (data) => {
        try {
          const qrData = QRService.parseQRData(data);
          if (qrData.type === 'usdc_transfer' || qrData.type === 'wallet_address') {
            setToAddress(qrData.address);
            if (qrData.amount) {
              setAmount(qrData.amount);
            }
            if (qrData.memo) {
              setMemo(qrData.memo);
            }
          } else {
            showErrorAlert('无效的二维码格式');
          }
        } catch (error) {
          showErrorAlert('二维码解析失败');
        }
      }
    });
  };

  const handlePasteAddress = async () => {
    try {
      const clipboardText = await QRService.getFromClipboard();
      if (clipboardText && isValidAddress(clipboardText)) {
        setToAddress(clipboardText);
      } else {
        showErrorAlert('剪贴板内容不是有效的地址');
      }
    } catch (error) {
      console.error('获取剪贴板内容失败:', error);
      showErrorAlert('获取剪贴板内容失败');
    }
  };

  const handleEstimateGas = async () => {
    if (!toAddress || !amount) {
      showErrorAlert('请先填写接收地址和金额');
      return;
    }

    try {
      setLoading(true);
      const estimate = await TransactionService.estimateTransactionFee(
        toAddress,
        parseFloat(amount),
        network
      );
      setGasEstimate(estimate);
    } catch (error) {
      console.error('估算Gas费用失败:', error);
      showErrorAlert('估算Gas费用失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    // 验证表单
    const validationErrors = {};
    
    if (!toAddress.trim()) {
      validationErrors.toAddress = '请输入接收地址';
    } else if (!isValidAddress(toAddress.trim())) {
      validationErrors.toAddress = '无效的地址格式';
    }
    
    if (!amount.trim()) {
      validationErrors.amount = '请输入发送金额';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      validationErrors.amount = '请输入有效的金额';
    } else if (parseFloat(amount) > parseFloat(balance)) {
      validationErrors.amount = '余额不足';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // 确认发送
    Alert.alert(
      '确认发送',
      `确定要发送 ${formatAmount(amount, 2, currency)} 到 ${toAddress} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await TransactionService.sendUSDC(
                toAddress.trim(),
                parseFloat(amount),
                network
              );
              
              if (result.success) {
                showSuccessAlert(
                  `交易已发送！\n交易哈希: ${result.txHash}`,
                  () => {
                    navigation.navigate('Home');
                  }
                );
              } else {
                showErrorAlert('交易发送失败');
              }
            } catch (error) {
              console.error('发送交易失败:', error);
              showErrorAlert('发送交易失败: ' + error.message);
            } finally {
              setLoading(false);
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

  const isFormValid = () => {
    return toAddress.trim() && amount.trim() && !Object.keys(errors).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 余额信息 */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>可用余额</Text>
          <Text style={styles.balanceAmount}>
            {formatAmount(balance, 2, 'USDC')}
          </Text>
        </Card>

        {/* 接收地址 */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>接收地址</Text>
          <Input
            label="钱包地址"
            placeholder="输入接收方钱包地址"
            value={toAddress}
            onChangeText={(text) => {
              setToAddress(text);
              if (errors.toAddress) {
                setErrors({ ...errors, toAddress: null });
              }
            }}
            error={errors.toAddress}
            style={styles.input}
          />
          
          <View style={styles.actionButtons}>
            <Button
              title="扫描二维码"
              onPress={handleScanQR}
              variant="outline"
              icon="📷"
              style={styles.actionButton}
            />
            <Button
              title="粘贴地址"
              onPress={handlePasteAddress}
              variant="outline"
              icon="📋"
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* 发送金额 */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>发送金额</Text>
          <Input
            label="金额"
            placeholder="输入发送金额"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (errors.amount) {
                setErrors({ ...errors, amount: null });
              }
            }}
            keyboardType="numeric"
            error={errors.amount}
            style={styles.input}
          />
          
          <View style={styles.currencySelector}>
            <Text style={styles.currencyLabel}>货币类型</Text>
            <View style={styles.currencyOptions}>
              {Object.keys(SUPPORTED_CURRENCIES).map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyOption,
                    currency === curr && styles.currencyOptionSelected
                  ]}
                  onPress={() => setCurrency(curr)}
                >
                  <Text style={[
                    styles.currencyText,
                    currency === curr && styles.currencyTextSelected
                  ]}>
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* 备注 */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>备注（可选）</Text>
          <Input
            label="备注"
            placeholder="输入备注信息"
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Card>

        {/* 网络选择 */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>网络</Text>
          <View style={styles.networkOptions}>
            <TouchableOpacity
              style={[
                styles.networkOption,
                network === 'ethereum' && styles.networkOptionSelected
              ]}
              onPress={() => setNetwork('ethereum')}
            >
              <Text style={styles.networkIcon}>🔷</Text>
              <Text style={styles.networkName}>Ethereum</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.networkOption,
                network === 'polygon' && styles.networkOptionSelected
              ]}
              onPress={() => setNetwork('polygon')}
            >
              <Text style={styles.networkIcon}>🟣</Text>
              <Text style={styles.networkName}>Polygon</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Gas费用估算 */}
        {gasEstimate && (
          <Card style={styles.gasCard}>
            <Text style={styles.cardTitle}>预估费用</Text>
            <View style={styles.gasInfo}>
              <Text style={styles.gasLabel}>Gas Limit: {gasEstimate.gasEstimate}</Text>
              <Text style={styles.gasLabel}>Gas Price: {gasEstimate.gasPrice}</Text>
              <Text style={styles.gasAmount}>
                总费用: {gasEstimate.totalFee} {gasEstimate.currency}
              </Text>
            </View>
          </Card>
        )}

        {/* 操作按钮 */}
        <View style={styles.buttonContainer}>
          <Button
            title="估算费用"
            onPress={handleEstimateGas}
            variant="outline"
            loading={loading}
            style={styles.button}
          />
          <Button
            title="发送"
            onPress={handleSend}
            loading={loading}
            disabled={!isFormValid()}
            style={styles.button}
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
  balanceCard: {
    marginBottom: UI_CONFIG.spacing.lg,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  balanceAmount: {
    fontSize: UI_CONFIG.fontSize.xxl,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
  },
  formCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  cardTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
  },
  input: {
    marginBottom: UI_CONFIG.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  currencySelector: {
    marginTop: UI_CONFIG.spacing.md,
  },
  currencyLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  currencyOptions: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.sm,
  },
  currencyOption: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    backgroundColor: UI_CONFIG.colors.surface,
  },
  currencyOptionSelected: {
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: '#E3F2FD',
  },
  currencyText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
  },
  currencyTextSelected: {
    color: UI_CONFIG.colors.primary,
    fontWeight: '600',
  },
  networkOptions: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.md,
  },
  networkOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    backgroundColor: UI_CONFIG.colors.surface,
  },
  networkOptionSelected: {
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: '#E3F2FD',
  },
  networkIcon: {
    fontSize: 20,
    marginRight: UI_CONFIG.spacing.sm,
  },
  networkName: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
  },
  gasCard: {
    marginBottom: UI_CONFIG.spacing.lg,
    backgroundColor: '#F5F5F5',
  },
  gasInfo: {
    gap: UI_CONFIG.spacing.sm,
  },
  gasLabel: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
  },
  gasAmount: {
    fontSize: UI_CONFIG.fontSize.md,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  button: {
    flex: 1,
  },
});

export default SendScreen;

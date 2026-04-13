import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, LoadingSpinner, Alert as CustomAlert, QRCode, Input } from '../components';
import WalletService from '../services/WalletService';
import QRService from '../services/QRService';
import { formatAddress, formatAmount } from '../utils/helpers';
import { UI_CONFIG, SUPPORTED_CURRENCIES } from '../utils/constants';

const { width: screenWidth } = Dimensions.get('window');

const ReceiveScreen = ({ navigation }) => {
  const [walletData, setWalletData] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [qrData, setQrData] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [currency, setCurrency] = useState('USDC');
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [qrFormat, setQrFormat] = useState('ethereum'); // ethereum, json, simple
  const [paymentStatus, setPaymentStatus] = useState('waiting'); // waiting, received, expired
  const [paymentTimer, setPaymentTimer] = useState(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  useEffect(() => {
    generateQRData();
  }, [walletData, amount, memo, currency]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const wallet = await WalletService.getCurrentWallet();
      
      if (wallet) {
        setWalletData(wallet);
        // 加载余额信息
        await loadBalances(wallet.address);
      } else {
        showErrorAlert('请先创建或导入钱包');
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

  const generateQRData = () => {
    if (!walletData) return;
    
    let qrData = '';
    
    switch (qrFormat) {
      case 'ethereum':
        if (amount && parseFloat(amount) > 0) {
          qrData = QRService.generateAddressWithAmountQR(walletData.address, amount);
        } else {
          qrData = QRService.generateSimpleAddressQR(walletData.address);
        }
        break;
      case 'json':
        if (amount && parseFloat(amount) > 0) {
          qrData = QRService.generateUSDCQRData(walletData.address, amount, memo);
        } else {
          qrData = QRService.generateWalletQRData(walletData.address);
        }
        break;
      case 'simple':
      default:
        qrData = walletData.address;
        break;
    }
    
    setQrData(qrData);
  };

  const handleCopyAddress = async () => {
    try {
      await QRService.copyToClipboard(walletData.address, '钱包地址');
    } catch (error) {
      console.error('复制地址失败:', error);
      showErrorAlert('复制地址失败');
    }
  };

  const handleCopyQRData = async () => {
    try {
      await QRService.copyToClipboard(qrData, '二维码数据');
    } catch (error) {
      console.error('复制二维码数据失败:', error);
      showErrorAlert('复制二维码数据失败');
    }
  };

  const handleShare = async () => {
    try {
      const shareText = amount && parseFloat(amount) > 0
        ? `请向我发送 ${formatAmount(amount, 2, currency)}\n钱包地址: ${walletData.address}`
        : `我的钱包地址: ${walletData.address}`;
      
      await Share.share({
        message: shareText,
        title: '我的钱包地址'
      });
    } catch (error) {
      console.error('分享失败:', error);
      showErrorAlert('分享失败');
    }
  };

  const handleSetAmount = () => {
    setShowAmountModal(true);
  };

  const handleAmountSubmit = (inputAmount, inputMemo) => {
    setAmount(inputAmount);
    setMemo(inputMemo);
    setShowAmountModal(false);
    setPaymentStatus('waiting');
    startPaymentTimer();
  };

  const startPaymentTimer = () => {
    // 设置15分钟付款超时
    const timer = setTimeout(() => {
      setPaymentStatus('expired');
    }, 15 * 60 * 1000);
    setPaymentTimer(timer);
  };

  const clearAmount = () => {
    setAmount('');
    setMemo('');
    setPaymentStatus('waiting');
    if (paymentTimer) {
      clearTimeout(paymentTimer);
      setPaymentTimer(null);
    }
  };

  const handleQRFormatChange = (format) => {
    setQrFormat(format);
  };

  const simulatePaymentReceived = () => {
    setPaymentStatus('received');
    if (paymentTimer) {
      clearTimeout(paymentTimer);
      setPaymentTimer(null);
    }
    showSuccessAlert('付款已收到！');
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

  const showSuccessAlert = (message) => {
    setAlertConfig({
      title: '成功',
      message,
      type: 'success',
      onConfirm: () => setShowAlert(false)
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
        {/* 余额信息 */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>当前余额</Text>
          <View style={styles.balanceContainer}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceAmount}>
                {formatAmount(balance, 4, 'ETH')}
              </Text>
              <Text style={styles.balanceCurrency}>ETH</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceAmount}>
                {formatAmount(usdcBalance, 2, 'USDC')}
              </Text>
              <Text style={styles.balanceCurrency}>USDC</Text>
            </View>
          </View>
        </Card>

        {/* 付款状态 */}
        {amount && parseFloat(amount) > 0 && (
          <Card style={styles.statusCard}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, styles[`status${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}`]]}>
                <Text style={styles.statusIcon}>
                  {paymentStatus === 'waiting' ? '⏳' : paymentStatus === 'received' ? '✅' : '❌'}
                </Text>
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {paymentStatus === 'waiting' ? '等待付款' : paymentStatus === 'received' ? '付款已收到' : '付款已过期'}
                </Text>
                <Text style={styles.statusDescription}>
                  {paymentStatus === 'waiting' ? '请让商家扫描二维码完成付款' : 
                   paymentStatus === 'received' ? '付款已成功到账' : '付款超时，请重新生成二维码'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* 二维码 */}
        <Card style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Text style={styles.cardTitle}>
              {amount && parseFloat(amount) > 0 ? '收款二维码' : '钱包地址二维码'}
            </Text>
            <View style={styles.qrFormatSelector}>
              <TouchableOpacity
                style={[styles.formatButton, qrFormat === 'ethereum' && styles.formatButtonSelected]}
                onPress={() => handleQRFormatChange('ethereum')}
              >
                <Text style={[styles.formatButtonText, qrFormat === 'ethereum' && styles.formatButtonTextSelected]}>
                  ETH
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatButton, qrFormat === 'json' && styles.formatButtonSelected]}
                onPress={() => handleQRFormatChange('json')}
              >
                <Text style={[styles.formatButtonText, qrFormat === 'json' && styles.formatButtonTextSelected]}>
                  JSON
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatButton, qrFormat === 'simple' && styles.formatButtonSelected]}
                onPress={() => handleQRFormatChange('simple')}
              >
                <Text style={[styles.formatButtonText, qrFormat === 'simple' && styles.formatButtonTextSelected]}>
                  简单
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={Math.min(screenWidth - 80, 280)}
              style={styles.qrCode}
            />
          </View>
          
          {amount && parseFloat(amount) > 0 && (
            <View style={styles.amountInfo}>
              <Text style={styles.amountLabel}>收款金额</Text>
              <Text style={styles.amountValue}>
                {formatAmount(amount, 2, currency)}
              </Text>
              {memo && (
                <Text style={styles.memoText}>备注: {memo}</Text>
              )}
            </View>
          )}
        </Card>

        {/* 钱包地址 */}
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

        {/* 收款设置 */}
        <Card style={styles.settingsCard}>
          <Text style={styles.cardTitle}>收款设置</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>收款金额（可选）</Text>
            <View style={styles.amountButtonContainer}>
              <Button
                title={amount ? `设置金额: ${formatAmount(amount, 2, currency)}` : '设置收款金额'}
                onPress={handleSetAmount}
                variant={amount ? 'outline' : 'primary'}
                style={styles.amountButton}
              />
              {amount && (
                <TouchableOpacity
                  style={styles.clearAmountButton}
                  onPress={clearAmount}
                >
                  <Text style={styles.clearAmountButtonText}>清除</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>货币类型</Text>
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
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>备注（可选）</Text>
            <Input
              placeholder="输入备注信息"
              value={memo}
              onChangeText={setMemo}
              multiline
              numberOfLines={2}
              style={styles.memoInput}
            />
          </View>
        </Card>

        {/* 操作按钮 */}
        <View style={styles.actionContainer}>
          <Button
            title="分享地址"
            onPress={handleShare}
            variant="outline"
            icon="📤"
            style={styles.actionButton}
          />
          <Button
            title="复制二维码"
            onPress={handleCopyQRData}
            variant="outline"
            icon="📋"
            style={styles.actionButton}
          />
          {amount && parseFloat(amount) > 0 && paymentStatus === 'waiting' && (
            <Button
              title="模拟收到付款"
              onPress={simulatePaymentReceived}
              variant="success"
              icon="✅"
              style={styles.actionButton}
            />
          )}
        </View>

        {/* 使用说明 */}
        <Card style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>使用说明</Text>
          <View style={styles.instructionList}>
            <Text style={styles.instructionItem}>
              • 让对方扫描二维码或复制钱包地址
            </Text>
            <Text style={styles.instructionItem}>
              • 可以设置收款金额，对方扫码时会看到具体金额
            </Text>
            <Text style={styles.instructionItem}>
              • 支持多种货币类型，请选择正确的货币
            </Text>
            <Text style={styles.instructionItem}>
              • 交易确认需要一定时间，请耐心等待
            </Text>
          </View>
        </Card>
      </ScrollView>
      
      {/* 金额输入模态框 */}
      <Modal
        visible={showAmountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAmountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>设置收款金额</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>金额</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="输入收款金额"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus={true}
              />
            </View>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>备注（可选）</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="输入备注信息"
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={2}
              />
            </View>
            
            <View style={styles.modalButtonContainer}>
              <Button
                title="取消"
                onPress={() => setShowAmountModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="确定"
                onPress={() => handleAmountSubmit(amount, memo)}
                style={styles.modalButton}
                disabled={!amount || parseFloat(amount) <= 0}
              />
            </View>
          </View>
        </View>
      </Modal>
      
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
  balanceCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  balanceLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: UI_CONFIG.fontSize.xl,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
  },
  balanceCurrency: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginTop: UI_CONFIG.spacing.xs,
  },
  qrCard: {
    marginBottom: UI_CONFIG.spacing.lg,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
    textAlign: 'center',
  },
  qrCode: {
    marginVertical: UI_CONFIG.spacing.md,
  },
  amountInfo: {
    alignItems: 'center',
    marginTop: UI_CONFIG.spacing.md,
    padding: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.background,
    borderRadius: UI_CONFIG.borderRadius.md,
  },
  amountLabel: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  amountValue: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.primary,
  },
  addressCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  addressText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  copyButton: {
    alignItems: 'center',
    padding: UI_CONFIG.spacing.sm,
  },
  copyButtonText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.primary,
    fontWeight: '500',
  },
  settingsCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  cardTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
  },
  settingItem: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  settingLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONFIG.spacing.sm,
  },
  amountInput: {
    flex: 1,
  },
  clearButton: {
    padding: UI_CONFIG.spacing.sm,
  },
  clearButtonText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.primary,
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
  memoInput: {
    marginTop: UI_CONFIG.spacing.sm,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  instructionCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  instructionTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
  },
  instructionList: {
    gap: UI_CONFIG.spacing.sm,
  },
  instructionItem: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    lineHeight: 20,
  },
  // 新增样式
  statusCard: {
    marginBottom: UI_CONFIG.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.spacing.md,
  },
  statusWaiting: {
    backgroundColor: '#FFF3CD',
    borderWidth: 2,
    borderColor: '#FFEAA7',
  },
  statusReceived: {
    backgroundColor: '#D4EDDA',
    borderWidth: 2,
    borderColor: '#C3E6CB',
  },
  statusExpired: {
    backgroundColor: '#F8D7DA',
    borderWidth: 2,
    borderColor: '#F5C6CB',
  },
  statusIcon: {
    fontSize: 24,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  statusDescription: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  qrFormatSelector: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.xs,
  },
  formatButton: {
    paddingHorizontal: UI_CONFIG.spacing.sm,
    paddingVertical: UI_CONFIG.spacing.xs,
    borderRadius: UI_CONFIG.borderRadius.sm,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    backgroundColor: UI_CONFIG.colors.surface,
  },
  formatButtonSelected: {
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: UI_CONFIG.colors.primary,
  },
  formatButtonText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.text,
  },
  formatButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  qrCode: {
    borderRadius: UI_CONFIG.borderRadius.md,
  },
  memoText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginTop: UI_CONFIG.spacing.xs,
    fontStyle: 'italic',
  },
  amountButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONFIG.spacing.sm,
  },
  amountButton: {
    flex: 1,
  },
  clearAmountButton: {
    padding: UI_CONFIG.spacing.sm,
  },
  clearAmountButtonText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.error,
    fontWeight: '500',
  },
  // 模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: UI_CONFIG.borderRadius.lg,
    padding: UI_CONFIG.spacing.xl,
    width: screenWidth - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: UI_CONFIG.fontSize.xl,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.lg,
  },
  modalInputContainer: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  modalLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    borderRadius: UI_CONFIG.borderRadius.md,
    padding: UI_CONFIG.spacing.md,
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    backgroundColor: UI_CONFIG.colors.surface,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default ReceiveScreen;

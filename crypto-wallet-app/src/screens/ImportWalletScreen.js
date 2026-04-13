import React, { useState } from 'react';
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
import QRService from '../services/QRService';
import { checkMnemonicStrength, isValidPrivateKey } from '../utils/helpers';
import { UI_CONFIG } from '../utils/constants';

const ImportWalletScreen = ({ navigation }) => {
  const [importType, setImportType] = useState('mnemonic'); // 'mnemonic' or 'privateKey'
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [errors, setErrors] = useState({});

  const handleImport = async () => {
    try {
      setLoading(true);
      setErrors({});
      
      let walletData;
      
      if (importType === 'mnemonic') {
        // 验证助记词
        const mnemonicValidation = checkMnemonicStrength(mnemonic.trim());
        if (!mnemonicValidation.valid) {
          setErrors({ mnemonic: mnemonicValidation.message });
          return;
        }
        
        walletData = await WalletService.importWalletFromMnemonic(mnemonic.trim());
      } else {
        // 验证私钥
        if (!isValidPrivateKey(privateKey.trim())) {
          setErrors({ privateKey: '无效的私钥格式' });
          return;
        }
        
        walletData = await WalletService.importWalletFromPrivateKey(privateKey.trim());
      }
      
      showSuccessAlert('钱包导入成功！', () => {
        navigation.navigate('Home');
      });
      
    } catch (error) {
      console.error('导入钱包失败:', error);
      showErrorAlert('导入钱包失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner', {
      onScan: (data) => {
        try {
          const qrData = QRService.parseQRData(data);
          if (qrData.type === 'wallet_address' && qrData.address) {
            // 如果是钱包地址，可以用于验证
            Alert.alert('扫描结果', `检测到钱包地址: ${qrData.address}`);
          } else {
            showErrorAlert('无效的二维码格式');
          }
        } catch (error) {
          showErrorAlert('二维码解析失败');
        }
      }
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await QRService.getFromClipboard();
      if (clipboardText) {
        if (importType === 'mnemonic') {
          setMnemonic(clipboardText);
        } else {
          setPrivateKey(clipboardText);
        }
      } else {
        showErrorAlert('剪贴板为空');
      }
    } catch (error) {
      console.error('获取剪贴板内容失败:', error);
      showErrorAlert('获取剪贴板内容失败');
    }
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
    if (importType === 'mnemonic') {
      return mnemonic.trim().length > 0;
    } else {
      return privateKey.trim().length > 0;
    }
  };

  const renderImportTypeSelector = () => (
    <Card style={styles.selectorCard}>
      <Text style={styles.selectorTitle}>选择导入方式</Text>
      
      <TouchableOpacity
        style={[
          styles.selectorOption,
          importType === 'mnemonic' && styles.selectorOptionSelected
        ]}
        onPress={() => setImportType('mnemonic')}
      >
        <Text style={styles.selectorIcon}>🔑</Text>
        <View style={styles.selectorContent}>
          <Text style={styles.selectorLabel}>助记词</Text>
          <Text style={styles.selectorDescription}>
            使用12-24个单词的助记词导入钱包
          </Text>
        </View>
        {importType === 'mnemonic' && (
          <Text style={styles.selectorCheck}>✓</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.selectorOption,
          importType === 'privateKey' && styles.selectorOptionSelected
        ]}
        onPress={() => setImportType('privateKey')}
      >
        <Text style={styles.selectorIcon}>🔐</Text>
        <View style={styles.selectorContent}>
          <Text style={styles.selectorLabel}>私钥</Text>
          <Text style={styles.selectorDescription}>
            使用64位十六进制私钥导入钱包
          </Text>
        </View>
        {importType === 'privateKey' && (
          <Text style={styles.selectorCheck}>✓</Text>
        )}
      </TouchableOpacity>
    </Card>
  );

  const renderMnemonicForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.formTitle}>输入助记词</Text>
      <Text style={styles.formDescription}>
        请输入您的12-24个助记词，用空格分隔
      </Text>
      
      <Input
        label="助记词"
        placeholder="word1 word2 word3 ..."
        value={mnemonic}
        onChangeText={setMnemonic}
        multiline
        numberOfLines={4}
        error={errors.mnemonic}
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
          title="从剪贴板粘贴"
          onPress={handlePasteFromClipboard}
          variant="outline"
          icon="📋"
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  const renderPrivateKeyForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.formTitle}>输入私钥</Text>
      <Text style={styles.formDescription}>
        请输入您的64位十六进制私钥（不包含0x前缀）
      </Text>
      
      <Input
        label="私钥"
        placeholder="输入64位十六进制私钥"
        value={privateKey}
        onChangeText={setPrivateKey}
        secureTextEntry
        error={errors.privateKey}
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
          title="从剪贴板粘贴"
          onPress={handlePasteFromClipboard}
          variant="outline"
          icon="📋"
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderImportTypeSelector()}
        
        {importType === 'mnemonic' ? renderMnemonicForm() : renderPrivateKeyForm()}
        
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ 安全提醒</Text>
          <Text style={styles.warningText}>
            • 请确保在安全的环境下输入私钥或助记词{'\n'}
            • 不要将私钥或助记词分享给任何人{'\n'}
            • 导入后请立即备份您的钱包信息{'\n'}
            • 建议使用助记词方式导入，更加安全
          </Text>
        </View>
        
        <Button
          title="导入钱包"
          onPress={handleImport}
          loading={loading}
          disabled={!isFormValid()}
          style={styles.importButton}
        />
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
  selectorCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  selectorTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  selectorOptionSelected: {
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: '#E3F2FD',
  },
  selectorIcon: {
    fontSize: 24,
    marginRight: UI_CONFIG.spacing.md,
  },
  selectorContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    fontWeight: '500',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  selectorDescription: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
  },
  selectorCheck: {
    fontSize: 20,
    color: UI_CONFIG.colors.primary,
    fontWeight: 'bold',
  },
  formCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  formTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  formDescription: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
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
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: UI_CONFIG.borderRadius.md,
    padding: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.lg,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningTitle: {
    fontSize: UI_CONFIG.fontSize.md,
    fontWeight: '600',
    color: UI_CONFIG.colors.warning,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  warningText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.warning,
    lineHeight: 20,
  },
  importButton: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
});

export default ImportWalletScreen;

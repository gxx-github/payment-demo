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
import { UI_CONFIG } from '../utils/constants';

const CreateWalletScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: 确认创建, 2: 显示助记词, 3: 验证助记词
  const [walletData, setWalletData] = useState(null);
  const [mnemonicWords, setMnemonicWords] = useState([]);
  const [verificationWords, setVerificationWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      const wallet = await WalletService.generateNewWallet();
      setWalletData(wallet);
      
      // 将助记词分割成单词数组
      const words = wallet.mnemonic.split(' ');
      setMnemonicWords(words);
      
      // 创建验证用的单词数组（随机顺序）
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      setVerificationWords(shuffledWords);
      
      setStep(2);
    } catch (error) {
      console.error('创建钱包失败:', error);
      showErrorAlert('创建钱包失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMnemonic = async () => {
    try {
      await QRService.copyToClipboard(walletData.mnemonic, '助记词');
    } catch (error) {
      console.error('复制助记词失败:', error);
      showErrorAlert('复制助记词失败');
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // 验证助记词
      const isCorrect = selectedWords.join(' ') === walletData.mnemonic;
      if (isCorrect) {
        try {
          // 保存钱包数据
          await WalletService.saveWalletData(walletData);
          showSuccessAlert(
            `钱包创建成功！\n\n钱包地址：\n${walletData.address}\n\n请妥善保管您的私钥和助记词！`, 
            () => {
              navigation.navigate('Home');
            }
          );
        } catch (error) {
          console.error('保存钱包数据失败:', error);
          showErrorAlert('保存钱包数据失败: ' + error.message);
        }
      } else {
        showErrorAlert('助记词验证失败，请重新选择');
        setSelectedWords([]);
      }
    }
  };

  const handleWordSelect = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
      setSelectedWords([]);
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

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>创建新钱包</Text>
      <Text style={styles.stepDescription}>
        我们将为您生成一个新的加密货币钱包，包括：
      </Text>
      
      <View style={styles.featureList}>
        <Text style={styles.featureItem}>• 唯一的钱包地址</Text>
        <Text style={styles.featureItem}>• 私钥（请妥善保管）</Text>
        <Text style={styles.featureItem}>• 12位助记词（用于恢复钱包）</Text>
        <Text style={styles.featureItem}>• 支持USDC转账功能</Text>
      </View>
      
      <Text style={styles.warningText}>
        ⚠️ 请务必妥善保管您的私钥和助记词，丢失后将无法恢复！
      </Text>
      
      <Button
        title="开始创建钱包"
        onPress={handleCreateWallet}
        loading={loading}
        style={styles.createButton}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>备份助记词</Text>
      <Text style={styles.stepDescription}>
        请按顺序抄写以下12个助记词，这是恢复钱包的唯一方式：
      </Text>
      
      <Card style={styles.mnemonicCard}>
        <View style={styles.mnemonicGrid}>
          {mnemonicWords.map((word, index) => (
            <View key={index} style={styles.mnemonicItem}>
              <Text style={styles.mnemonicNumber}>{index + 1}</Text>
              <Text style={styles.mnemonicWord}>{word}</Text>
            </View>
          ))}
        </View>
      </Card>
      
      <TouchableOpacity
        style={styles.copyButton}
        onPress={handleCopyMnemonic}
      >
        <Text style={styles.copyButtonText}>📋 复制助记词</Text>
      </TouchableOpacity>
      
      <Text style={styles.warningText}>
        ⚠️ 请将助记词写在纸上并妥善保管，不要截图或保存在联网设备上！
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="上一步"
          onPress={handleBack}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="下一步"
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>验证助记词</Text>
      <Text style={styles.stepDescription}>
        请按正确顺序选择助记词，以确认您已正确备份：
      </Text>
      
      <View style={styles.selectedWordsContainer}>
        <Text style={styles.selectedWordsLabel}>已选择的单词：</Text>
        <View style={styles.selectedWords}>
          {selectedWords.map((word, index) => (
            <TouchableOpacity
              key={`selected-${index}`}
              style={styles.selectedWordChip}
              onPress={() => setSelectedWords(selectedWords.filter((_, i) => i !== index))}
            >
              <Text style={styles.selectedWordText}>{word}</Text>
              <Text style={styles.removeIcon}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.verificationWordsContainer}>
        <Text style={styles.verificationWordsLabel}>选择单词：</Text>
        <View style={styles.verificationWords}>
          {verificationWords.map((word, index) => (
            <TouchableOpacity
              key={`verification-${index}`}
              style={[
                styles.verificationWordChip,
                selectedWords.includes(word) && styles.verificationWordChipSelected
              ]}
              onPress={() => handleWordSelect(word)}
              disabled={selectedWords.includes(word)}
            >
              <Text style={[
                styles.verificationWordText,
                selectedWords.includes(word) && styles.verificationWordTextSelected
              ]}>
                {word}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="上一步"
          onPress={handleBack}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="完成"
          onPress={handleNext}
          disabled={selectedWords.length !== 12}
          style={styles.button}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
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
  stepContainer: {
    flex: 1,
    padding: UI_CONFIG.spacing.md,
  },
  stepTitle: {
    fontSize: UI_CONFIG.fontSize.xxl,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  stepDescription: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  featureList: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  featureItem: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  warningText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.warning,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: UI_CONFIG.spacing.xl,
    padding: UI_CONFIG.spacing.md,
    backgroundColor: '#FFF3CD',
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  createButton: {
    marginTop: UI_CONFIG.spacing.lg,
  },
  mnemonicCard: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  mnemonicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mnemonicItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.sm,
    marginBottom: UI_CONFIG.spacing.sm,
    backgroundColor: UI_CONFIG.colors.background,
    borderRadius: UI_CONFIG.borderRadius.sm,
  },
  mnemonicNumber: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    marginRight: UI_CONFIG.spacing.sm,
    minWidth: 20,
  },
  mnemonicWord: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    fontFamily: 'monospace',
  },
  copyButton: {
    alignItems: 'center',
    padding: UI_CONFIG.spacing.md,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  copyButtonText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.primary,
    fontWeight: '500',
  },
  selectedWordsContainer: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  selectedWordsLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  selectedWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 60,
    padding: UI_CONFIG.spacing.sm,
    backgroundColor: UI_CONFIG.colors.background,
    borderRadius: UI_CONFIG.borderRadius.md,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  selectedWordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.colors.primary,
    paddingHorizontal: UI_CONFIG.spacing.sm,
    paddingVertical: UI_CONFIG.spacing.xs,
    borderRadius: UI_CONFIG.borderRadius.sm,
    margin: UI_CONFIG.spacing.xs,
  },
  selectedWordText: {
    color: '#FFFFFF',
    fontSize: UI_CONFIG.fontSize.sm,
    marginRight: UI_CONFIG.spacing.xs,
  },
  removeIcon: {
    color: '#FFFFFF',
    fontSize: UI_CONFIG.fontSize.sm,
    fontWeight: 'bold',
  },
  verificationWordsContainer: {
    marginBottom: UI_CONFIG.spacing.lg,
  },
  verificationWordsLabel: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  verificationWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  verificationWordChip: {
    backgroundColor: UI_CONFIG.colors.surface,
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    borderRadius: UI_CONFIG.borderRadius.sm,
    margin: UI_CONFIG.spacing.xs,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  verificationWordChipSelected: {
    backgroundColor: UI_CONFIG.colors.primary,
  },
  verificationWordText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.text,
  },
  verificationWordTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.spacing.md,
    marginTop: UI_CONFIG.spacing.lg,
  },
  button: {
    flex: 1,
  },
});

export default CreateWalletScreen;

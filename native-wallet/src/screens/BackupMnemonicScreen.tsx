import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackNavigationProp, BackupMnemonicRouteProp } from '../types/navigation';
import { Button } from '../components/Button';
import { Colors } from '../styles/colors';

export const BackupMnemonicScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<BackupMnemonicRouteProp>();
  const { mnemonic } = route.params;
  
  const [confirmed, setConfirmed] = useState(false);
  const words = mnemonic.split(' ');

  const handleContinue = () => {
    if (!confirmed) {
      Alert.alert('提示', '请确认您已备份助记词');
      return;
    }
    
    Alert.alert(
      '钱包创建成功',
      '您的钱包已成功创建',
      [
        {
          text: '确定',
          onPress: () => navigation.replace('MainTabs'),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>备份助记词</Text>
          <Text style={styles.subtitle}>
            请按顺序抄写下方的 12 个助记词
          </Text>
        </View>

        <View style={styles.mnemonicContainer}>
          {words.map((word, index) => (
            <View key={index} style={styles.wordItem}>
              <Text style={styles.wordIndex}>{index + 1}.</Text>
              <Text style={styles.wordText}>{word}</Text>
            </View>
          ))}
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ 安全提示</Text>
          <Text style={styles.warningText}>
            • 请将助记词抄写在纸上，保存在安全的地方{'\n'}
            • 不要截图或保存在联网的设备上{'\n'}
            • 任何人获得助记词都可以控制您的钱包{'\n'}
            • 丢失助记词将无法恢复钱包
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setConfirmed(!confirmed)}>
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            我已将助记词抄写并妥善保管
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="继续"
          onPress={handleContinue}
          disabled={!confirmed}
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
    marginBottom: 24,
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
  mnemonicContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  wordIndex: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
    width: 24,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    marginBottom: 24,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  footer: {
    padding: 24,
  },
});


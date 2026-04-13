import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { Button, Card, LoadingSpinner, Alert as CustomAlert } from '../components';
import QRService from '../services/QRService';
import { UI_CONFIG } from '../utils/constants';

const QRScannerScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [scannedData, setScannedData] = useState('');

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web环境直接设置为true，浏览器会处理权限
        setHasPermission(true);
      } else {
        // 移动端环境，直接设置为true，避免Web环境问题
        setHasPermission(true);
      }
    } catch (error) {
      console.error('请求相机权限失败:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setScannedData(data);
    
    try {
      // 解析二维码数据
      const qrData = QRService.parseQRData(data);
      
      // 根据二维码类型处理
      if (qrData.type === 'wallet_address') {
        handleWalletAddress(qrData);
      } else if (qrData.type === 'usdc_transfer') {
        handleUSDCTransfer(qrData);
      } else if (qrData.type === 'ethereum') {
        handleEthereumAddress(qrData);
      } else {
        showErrorAlert('不支持的二维码类型');
      }
    } catch (error) {
      console.error('解析二维码失败:', error);
      showErrorAlert('无效的二维码格式');
    }
  };

  const handleWalletAddress = (qrData) => {
    Alert.alert(
      '扫描结果',
      `检测到钱包地址: ${qrData.address}`,
      [
        { text: '取消', onPress: () => setScanned(false) },
        {
          text: '使用地址',
          onPress: () => {
            if (route.params?.onScan) {
              route.params.onScan(JSON.stringify(qrData));
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleUSDCTransfer = (qrData) => {
    Alert.alert(
      '扫描结果',
      `检测到USDC转账请求:\n地址: ${qrData.address}\n金额: ${qrData.amount || '未指定'}\n备注: ${qrData.memo || '无'}`,
      [
        { text: '取消', onPress: () => setScanned(false) },
        {
          text: '确认发送',
          onPress: () => {
            if (route.params?.onScan) {
              route.params.onScan(JSON.stringify(qrData));
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleEthereumAddress = (qrData) => {
    // 处理简单的以太坊地址格式
    const address = qrData.startsWith('ethereum:') 
      ? qrData.replace('ethereum:', '') 
      : qrData;
    
    Alert.alert(
      '扫描结果',
      `检测到以太坊地址: ${address}`,
      [
        { text: '取消', onPress: () => setScanned(false) },
        {
          text: '使用地址',
          onPress: () => {
            if (route.params?.onScan) {
              route.params.onScan(JSON.stringify({
                type: 'wallet_address',
                address: address
              }));
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleManualInput = () => {
    Alert.prompt(
      '手动输入',
      '请输入二维码内容：',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (text) => {
            if (text) {
              setScannedData(text);
              handleBarCodeScanned({ type: 'manual', data: text });
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleCopyScannedData = async () => {
    try {
      await QRService.copyToClipboard(scannedData, '扫描内容');
    } catch (error) {
      console.error('复制失败:', error);
      showErrorAlert('复制失败');
    }
  };

  const handleRescan = () => {
    setScanned(false);
    setScannedData('');
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

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner visible={true} text="请求相机权限..." />
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>需要相机权限</Text>
          <Text style={styles.permissionText}>
            应用需要访问相机来扫描二维码，请在设置中允许相机权限。
          </Text>
          <Button
            title="重新请求权限"
            onPress={requestCameraPermission}
            style={styles.permissionButton}
          />
          <Button
            title="手动输入"
            onPress={handleManualInput}
            variant="outline"
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          onBarCodeScanned={handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: ['qr', 'pdf417'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.topOverlay}>
              <Text style={styles.overlayTitle}>扫描二维码</Text>
              <Text style={styles.overlaySubtitle}>
                将二维码放在扫描框内
              </Text>
            </View>
            
            <View style={styles.middleOverlay}>
              <View style={styles.leftOverlay} />
              <View style={styles.scanArea}>
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.topLeft]} />
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.topRight]} />
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.bottomLeft]} />
                <View style={styles.scanCorner} style={[styles.scanCorner, styles.bottomRight]} />
              </View>
              <View style={styles.rightOverlay} />
            </View>
            
            <View style={styles.bottomOverlay}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleManualInput}
              >
                <Text style={styles.actionButtonText}>📝 手动输入</Text>
              </TouchableOpacity>
              
              {scanned && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleRescan}
                >
                  <Text style={styles.actionButtonText}>🔄 重新扫描</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Camera>
      </View>
      
      {scanned && (
        <Card style={styles.resultCard}>
          <Text style={styles.resultTitle}>扫描结果</Text>
          <Text style={styles.resultText}>{scannedData}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyScannedData}
          >
            <Text style={styles.copyButtonText}>📋 复制内容</Text>
          </TouchableOpacity>
        </Card>
      )}
      
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
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  overlayTitle: {
    fontSize: UI_CONFIG.fontSize.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  overlaySubtitle: {
    fontSize: UI_CONFIG.fontSize.md,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  middleOverlay: {
    flex: 2,
    flexDirection: 'row',
  },
  leftOverlay: {
    flex: 1,
  },
  rightOverlay: {
    flex: 1,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: UI_CONFIG.colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
    gap: UI_CONFIG.spacing.md,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: UI_CONFIG.spacing.lg,
    paddingVertical: UI_CONFIG.spacing.md,
    borderRadius: UI_CONFIG.borderRadius.md,
  },
  actionButtonText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.xl,
  },
  permissionTitle: {
    fontSize: UI_CONFIG.fontSize.xl,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UI_CONFIG.spacing.xl,
  },
  permissionButton: {
    marginBottom: UI_CONFIG.spacing.md,
    minWidth: 200,
  },
  resultCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    margin: UI_CONFIG.spacing.md,
  },
  resultTitle: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  resultText: {
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.textSecondary,
    fontFamily: 'monospace',
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
});

export default QRScannerScreen;

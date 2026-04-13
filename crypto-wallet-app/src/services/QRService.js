import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

class QRService {
  // 生成钱包地址二维码数据
  generateWalletQRData(address, amount = null) {
    const qrData = {
      type: 'wallet_address',
      address: address,
      amount: amount,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  }

  // 生成USDC转账二维码数据
  generateUSDCQRData(address, amount, memo = '') {
    const qrData = {
      type: 'usdc_transfer',
      address: address,
      amount: amount,
      memo: memo,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  }

  // 解析二维码数据
  parseQRData(qrString) {
    try {
      const data = JSON.parse(qrString);
      
      // 验证必要字段
      if (!data.type || !data.address) {
        throw new Error('无效的二维码数据');
      }

      return data;
    } catch (error) {
      console.error('解析二维码数据失败:', error);
      throw new Error('无效的二维码格式');
    }
  }

  // 复制到剪贴板
  async copyToClipboard(text, label = '内容') {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('成功', `${label}已复制到剪贴板`);
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert('错误', '复制失败');
    }
  }

  // 从剪贴板获取内容
  async getFromClipboard() {
    try {
      const text = await Clipboard.getStringAsync();
      return text;
    } catch (error) {
      console.error('获取剪贴板内容失败:', error);
      return '';
    }
  }

  // 验证地址格式
  isValidAddress(address) {
    // 简单的以太坊地址验证
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // 生成简单的文本二维码数据（用于简单地址）
  generateSimpleAddressQR(address) {
    return `ethereum:${address}`;
  }

  // 生成带金额的地址二维码
  generateAddressWithAmountQR(address, amount) {
    return `ethereum:${address}?value=${amount}`;
  }

  // 格式化地址显示（中间省略）
  formatAddress(address, startLength = 6, endLength = 4) {
    if (!address || address.length < startLength + endLength) {
      return address;
    }
    
    const start = address.substring(0, startLength);
    const end = address.substring(address.length - endLength);
    return `${start}...${end}`;
  }

  // 验证二维码类型
  isValidQRType(qrData) {
    const validTypes = ['wallet_address', 'usdc_transfer', 'ethereum'];
    return validTypes.includes(qrData.type) || qrData.startsWith('ethereum:');
  }
}

export default new QRService();

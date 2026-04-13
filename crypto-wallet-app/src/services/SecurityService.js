import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { ethers } from 'ethers';

class SecurityService {
  constructor() {
    this.encryptionKey = 'crypto_wallet_encryption_key';
    this.biometricKey = 'crypto_wallet_biometric_key';
  }

  // 生成随机密钥
  async generateRandomKey(length = 32) {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(length);
      return ethers.hexlify(randomBytes);
    } catch (error) {
      console.error('生成随机密钥失败:', error);
      throw new Error('生成随机密钥失败');
    }
  }

  // 加密数据
  async encryptData(data, password) {
    try {
      const dataString = JSON.stringify(data);
      const key = await this.deriveKey(password);
      const iv = await Crypto.getRandomBytesAsync(16);
      
      // 使用AES加密
      const encrypted = await Crypto.encryptAsync(
        dataString,
        key,
        {
          algorithm: 'AES-256-CBC',
          iv: iv
        }
      );
      
      return {
        encrypted: encrypted,
        iv: ethers.hexlify(iv)
      };
    } catch (error) {
      console.error('加密数据失败:', error);
      throw new Error('加密数据失败');
    }
  }

  // 解密数据
  async decryptData(encryptedData, password) {
    try {
      const key = await this.deriveKey(password);
      const decrypted = await Crypto.decryptAsync(
        encryptedData.encrypted,
        key,
        {
          algorithm: 'AES-256-CBC',
          iv: ethers.arrayify(encryptedData.iv)
        }
      );
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('解密数据失败:', error);
      throw new Error('解密数据失败');
    }
  }

  // 从密码派生密钥
  async deriveKey(password) {
    try {
      const salt = await this.getOrCreateSalt();
      const key = await Crypto.digestStringAsync(
        'SHA256',
        password + salt,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      return key;
    } catch (error) {
      console.error('派生密钥失败:', error);
      throw new Error('派生密钥失败');
    }
  }

  // 获取或创建盐值
  async getOrCreateSalt() {
    try {
      let salt = await SecureStore.getItemAsync('wallet_salt');
      if (!salt) {
        salt = await this.generateRandomKey(16);
        await SecureStore.setItemAsync('wallet_salt', salt);
      }
      return salt;
    } catch (error) {
      console.error('获取盐值失败:', error);
      throw new Error('获取盐值失败');
    }
  }

  // 安全存储敏感数据
  async secureStore(key, value, password = null) {
    try {
      if (password) {
        const encrypted = await this.encryptData(value, password);
        await SecureStore.setItemAsync(key, JSON.stringify(encrypted));
      } else {
        await SecureStore.setItemAsync(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('安全存储失败:', error);
      throw new Error('安全存储失败');
    }
  }

  // 安全获取敏感数据
  async secureGet(key, password = null) {
    try {
      const encryptedData = await SecureStore.getItemAsync(key);
      if (!encryptedData) return null;

      if (password) {
        const parsed = JSON.parse(encryptedData);
        return await this.decryptData(parsed, password);
      } else {
        return JSON.parse(encryptedData);
      }
    } catch (error) {
      console.error('安全获取失败:', error);
      throw new Error('安全获取失败');
    }
  }

  // 安全删除数据
  async secureDelete(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('安全删除失败:', error);
      throw new Error('安全删除失败');
    }
  }

  // 验证密码强度
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;

    let strength = 'weak';
    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return {
      score,
      strength,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  }

  // 生成安全密码
  async generateSecurePassword(length = 16) {
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      
      for (let i = 0; i < length; i++) {
        const randomBytes = await Crypto.getRandomBytesAsync(1);
        password += chars[randomBytes[0] % chars.length];
      }
      
      return password;
    } catch (error) {
      console.error('生成安全密码失败:', error);
      throw new Error('生成安全密码失败');
    }
  }

  // 生物识别认证
  async enableBiometricAuth() {
    try {
      // 这里需要集成具体的生物识别库
      // 例如 react-native-biometrics 或 expo-local-authentication
      console.log('生物识别认证功能需要集成具体的生物识别库');
      return false;
    } catch (error) {
      console.error('启用生物识别认证失败:', error);
      throw new Error('启用生物识别认证失败');
    }
  }

  // 验证生物识别
  async authenticateWithBiometric() {
    try {
      // 这里需要集成具体的生物识别库
      console.log('生物识别验证功能需要集成具体的生物识别库');
      return false;
    } catch (error) {
      console.error('生物识别验证失败:', error);
      throw new Error('生物识别验证失败');
    }
  }

  // 生成钱包备份
  async generateWalletBackup(walletData, password) {
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        walletData: walletData,
        checksum: await this.generateChecksum(walletData)
      };

      const encrypted = await this.encryptData(backupData, password);
      return {
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        version: backupData.version,
        timestamp: backupData.timestamp
      };
    } catch (error) {
      console.error('生成钱包备份失败:', error);
      throw new Error('生成钱包备份失败');
    }
  }

  // 恢复钱包备份
  async restoreWalletBackup(backupData, password) {
    try {
      const decrypted = await this.decryptData(backupData, password);
      
      // 验证校验和
      const checksum = await this.generateChecksum(decrypted.walletData);
      if (checksum !== decrypted.checksum) {
        throw new Error('备份文件已损坏');
      }

      return decrypted.walletData;
    } catch (error) {
      console.error('恢复钱包备份失败:', error);
      throw new Error('恢复钱包备份失败');
    }
  }

  // 生成校验和
  async generateChecksum(data) {
    try {
      const dataString = JSON.stringify(data);
      return await Crypto.digestStringAsync(
        'SHA256',
        dataString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    } catch (error) {
      console.error('生成校验和失败:', error);
      throw new Error('生成校验和失败');
    }
  }

  // 验证钱包完整性
  async validateWalletIntegrity(walletData) {
    try {
      const expectedChecksum = await this.generateChecksum(walletData);
      const storedChecksum = await SecureStore.getItemAsync('wallet_checksum');
      
      if (storedChecksum && expectedChecksum !== storedChecksum) {
        return false;
      }
      
      // 更新校验和
      await SecureStore.setItemAsync('wallet_checksum', expectedChecksum);
      return true;
    } catch (error) {
      console.error('验证钱包完整性失败:', error);
      return false;
    }
  }

  // 清除所有安全数据
  async clearAllSecurityData() {
    try {
      const keys = [
        'wallet_salt',
        'wallet_checksum',
        'crypto_wallet_data',
        'user_settings',
        'transaction_history'
      ];

      for (const key of keys) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('清除安全数据失败:', error);
      throw new Error('清除安全数据失败');
    }
  }

  // 获取安全状态
  async getSecurityStatus() {
    try {
      const hasWallet = await SecureStore.getItemAsync('crypto_wallet_data') !== null;
      const hasSalt = await SecureStore.getItemAsync('wallet_salt') !== null;
      const hasChecksum = await SecureStore.getItemAsync('wallet_checksum') !== null;

      return {
        hasWallet,
        hasSalt,
        hasChecksum,
        isSecure: hasWallet && hasSalt && hasChecksum
      };
    } catch (error) {
      console.error('获取安全状态失败:', error);
      return {
        hasWallet: false,
        hasSalt: false,
        hasChecksum: false,
        isSecure: false
      };
    }
  }
}

export default new SecurityService();

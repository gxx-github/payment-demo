import * as SecureStore from 'expo-secure-store';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';

// 在Web环境中设置全局Buffer
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = Buffer;
}

class WalletService {
  constructor() {
    this.walletKey = 'crypto_wallet_data';
  }

  // 生成新的钱包
  async generateNewWallet() {
    try {
      // 生成助记词
      const mnemonic = bip39.generateMnemonic();
      
      // 从助记词创建钱包
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic,
        publicKey: wallet.publicKey,
        createdAt: new Date().toISOString()
      };

      // 安全存储钱包数据
      await this.saveWalletData(walletData);
      
      return walletData;
    } catch (error) {
      console.error('生成钱包失败:', error);
      throw new Error('生成钱包失败: ' + error.message);
    }
  }

  // 从助记词导入钱包
  async importWalletFromMnemonic(mnemonic) {
    try {
      // 验证助记词
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('无效的助记词');
      }

      // 从助记词创建钱包
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic,
        publicKey: wallet.publicKey,
        createdAt: new Date().toISOString()
      };

      // 安全存储钱包数据
      await this.saveWalletData(walletData);
      
      return walletData;
    } catch (error) {
      console.error('导入钱包失败:', error);
      throw new Error('导入钱包失败: ' + error.message);
    }
  }

  // 从私钥导入钱包
  async importWalletFromPrivateKey(privateKey) {
    try {
      // 从私钥创建钱包
      const wallet = new ethers.Wallet(privateKey);
      
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: null, // 私钥导入没有助记词
        publicKey: wallet.publicKey,
        createdAt: new Date().toISOString()
      };

      // 安全存储钱包数据
      await this.saveWalletData(walletData);
      
      return walletData;
    } catch (error) {
      console.error('导入钱包失败:', error);
      throw new Error('导入钱包失败: ' + error.message);
    }
  }

  // 获取当前钱包
  async getCurrentWallet() {
    try {
      // 在Web环境中使用localStorage，移动端使用SecureStore
      if (Platform.OS === 'web') {
        const walletData = localStorage.getItem(this.walletKey);
        return walletData ? JSON.parse(walletData) : null;
      } else {
        const walletData = await SecureStore.getItemAsync(this.walletKey);
        return walletData ? JSON.parse(walletData) : null;
      }
    } catch (error) {
      console.error('获取钱包数据失败:', error);
      return null;
    }
  }

  // 保存钱包数据
  async saveWalletData(walletData) {
    try {
      // 在Web环境中使用localStorage，移动端使用SecureStore
      if (Platform.OS === 'web') {
        localStorage.setItem(this.walletKey, JSON.stringify(walletData));
      } else {
        await SecureStore.setItemAsync(this.walletKey, JSON.stringify(walletData));
      }
    } catch (error) {
      console.error('保存钱包数据失败:', error);
      throw new Error('保存钱包数据失败');
    }
  }

  // 删除钱包数据
  async deleteWallet() {
    try {
      // 在Web环境中使用localStorage，移动端使用SecureStore
      if (Platform.OS === 'web') {
        localStorage.removeItem(this.walletKey);
      } else {
        await SecureStore.deleteItemAsync(this.walletKey);
      }
    } catch (error) {
      console.error('删除钱包数据失败:', error);
      throw new Error('删除钱包数据失败');
    }
  }

  // 验证地址格式
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  // 验证私钥格式
  isValidPrivateKey(privateKey) {
    try {
      // 移除0x前缀（如果有）
      const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      return cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey);
    } catch (error) {
      return false;
    }
  }

  // 获取钱包余额（需要网络连接）
  async getWalletBalance(address, providerUrl = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY') {
    try {
      const provider = new ethers.JsonRpcProvider(providerUrl);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      throw new Error('获取余额失败: ' + error.message);
    }
  }

  // 获取USDC余额
  async getUSDCBalance(address, network = 'ethereum') {
    try {
      const networks = {
        ethereum: {
          rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
          usdcAddress: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C' // 需要替换为真实USDC地址
        },
        polygon: {
          rpcUrl: 'https://polygon-rpc.com',
          usdcAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
        },
        bsc: {
          rpcUrl: 'https://bsc-dataseed.binance.org',
          usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
        },
        arbitrum: {
          rpcUrl: 'https://arb1.arbitrum.io/rpc',
          usdcAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
        }
      };

      const networkConfig = networks[network];
      if (!networkConfig) {
        throw new Error('不支持的网络');
      }

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      
      // USDC合约ABI
      const usdcABI = [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];

      const usdcContract = new ethers.Contract(networkConfig.usdcAddress, usdcABI, provider);
      
      // 获取余额
      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      
      // 转换为可读格式
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      return formattedBalance;
    } catch (error) {
      console.error('获取USDC余额失败:', error);
      throw new Error('获取USDC余额失败: ' + error.message);
    }
  }

  // 获取多个网络的USDC余额
  async getMultiNetworkUSDCBalance(address) {
    const networks = ['ethereum', 'polygon', 'bsc', 'arbitrum'];
    const balances = {};

    for (const network of networks) {
      try {
        const balance = await this.getUSDCBalance(address, network);
        balances[network] = balance;
      } catch (error) {
        console.error(`获取${network}网络USDC余额失败:`, error);
        balances[network] = '0.0';
      }
    }

    return balances;
  }

  // 获取代币余额（通用方法）
  async getTokenBalance(address, tokenAddress, network = 'ethereum') {
    try {
      const networks = {
        ethereum: {
          rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
        },
        polygon: {
          rpcUrl: 'https://polygon-rpc.com'
        },
        bsc: {
          rpcUrl: 'https://bsc-dataseed.binance.org'
        },
        arbitrum: {
          rpcUrl: 'https://arb1.arbitrum.io/rpc'
        }
      };

      const networkConfig = networks[network];
      if (!networkConfig) {
        throw new Error('不支持的网络');
      }

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      
      // ERC20代币ABI
      const tokenABI = [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
      
      // 获取余额和代币信息
      const [balance, decimals, symbol, name] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.name()
      ]);
      
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      return {
        balance: formattedBalance,
        symbol,
        name,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('获取代币余额失败:', error);
      throw new Error('获取代币余额失败: ' + error.message);
    }
  }
}

export default new WalletService();

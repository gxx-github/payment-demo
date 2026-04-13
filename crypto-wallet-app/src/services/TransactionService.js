import { ethers } from 'ethers';
import WalletService from './WalletService';

class TransactionService {
  constructor() {
    // 这里可以配置不同的网络
    this.networks = {
      ethereum: {
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        chainId: 1,
        usdcAddress: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C' // 示例USDC地址
      },
      polygon: {
        name: 'Polygon',
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        usdcAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
      }
    };
  }

  // 发送USDC交易
  async sendUSDC(toAddress, amount, network = 'ethereum') {
    try {
      const walletData = await WalletService.getCurrentWallet();
      if (!walletData) {
        throw new Error('请先创建或导入钱包');
      }

      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error('不支持的网络');
      }

      // 创建provider和wallet
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const wallet = new ethers.Wallet(walletData.privateKey, provider);

      // USDC合约ABI（简化版）
      const usdcABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];

      // 创建USDC合约实例
      const usdcContract = new ethers.Contract(networkConfig.usdcAddress, usdcABI, wallet);

      // 获取USDC小数位数
      const decimals = await usdcContract.decimals();
      
      // 转换金额（USDC通常是6位小数）
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // 检查余额
      const balance = await usdcContract.balanceOf(wallet.address);
      if (balance < amountWei) {
        throw new Error('USDC余额不足');
      }

      // 估算gas费用
      const gasEstimate = await usdcContract.transfer.estimateGas(toAddress, amountWei);
      
      // 发送交易
      const tx = await usdcContract.transfer(toAddress, amountWei, {
        gasLimit: gasEstimate * 120n / 100n // 增加20%的gas限制
      });

      // 等待交易确认
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        to: toAddress,
        amount: amount,
        network: network
      };

    } catch (error) {
      console.error('发送USDC失败:', error);
      throw new Error('发送USDC失败: ' + error.message);
    }
  }

  // 获取交易历史
  async getTransactionHistory(address, network = 'ethereum', limit = 50) {
    try {
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error('不支持的网络');
      }

      // 使用Etherscan API获取交易历史
      const apiKey = 'YOUR_ETHERSCAN_API_KEY'; // 需要替换为真实的API Key
      const baseUrl = this.getExplorerApiUrl(network);
      
      const response = await fetch(
        `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        return data.result.map(tx => this.formatTransaction(tx, network));
      } else {
        console.warn('获取交易历史失败:', data.message);
        return [];
      }
    } catch (error) {
      console.error('获取交易历史失败:', error);
      // 返回空数组而不是抛出错误，避免影响用户体验
      return [];
    }
  }

  // 获取USDC交易历史
  async getUSDCTransactionHistory(address, network = 'ethereum', limit = 50) {
    try {
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error('不支持的网络');
      }

      const apiKey = 'YOUR_ETHERSCAN_API_KEY';
      const baseUrl = this.getExplorerApiUrl(network);
      
      const response = await fetch(
        `${baseUrl}?module=account&action=tokentx&contractaddress=${networkConfig.usdcAddress}&address=${address}&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        return data.result.map(tx => this.formatTokenTransaction(tx, network));
      } else {
        console.warn('获取USDC交易历史失败:', data.message);
        return [];
      }
    } catch (error) {
      console.error('获取USDC交易历史失败:', error);
      return [];
    }
  }

  // 格式化普通交易
  formatTransaction(tx, network) {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: ethers.formatEther(tx.value),
      currency: 'ETH',
      status: this.getTransactionStatus(tx),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      blockNumber: parseInt(tx.blockNumber),
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      network: network,
      type: 'native'
    };
  }

  // 格式化代币交易
  formatTokenTransaction(tx, network) {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: ethers.formatUnits(tx.value, tx.tokenDecimal),
      currency: tx.tokenSymbol,
      status: this.getTransactionStatus(tx),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      blockNumber: parseInt(tx.blockNumber),
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      network: network,
      type: 'token',
      tokenAddress: tx.contractAddress
    };
  }

  // 获取交易状态
  getTransactionStatus(tx) {
    if (tx.isError === '1') {
      return 'failed';
    } else if (tx.confirmations === '0') {
      return 'pending';
    } else {
      return 'confirmed';
    }
  }

  // 获取区块链浏览器API URL
  getExplorerApiUrl(network) {
    const urls = {
      ethereum: 'https://api.etherscan.io/api',
      polygon: 'https://api.polygonscan.com/api',
      bsc: 'https://api.bscscan.com/api',
      arbitrum: 'https://api.arbiscan.io/api'
    };
    return urls[network] || urls.ethereum;
  }

  // 获取交易详情
  async getTransactionDetails(txHash, network = 'ethereum') {
    try {
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error('不支持的网络');
      }

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!tx) {
        throw new Error('交易不存在');
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice.toString(),
        nonce: tx.nonce,
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending',
        gasUsed: receipt ? receipt.gasUsed.toString() : '0',
        timestamp: new Date().toISOString(), // 需要从区块获取实际时间
        network: network
      };
    } catch (error) {
      console.error('获取交易详情失败:', error);
      throw new Error('获取交易详情失败: ' + error.message);
    }
  }

  // 估算交易费用
  async estimateTransactionFee(toAddress, amount, network = 'ethereum') {
    try {
      const walletData = await WalletService.getCurrentWallet();
      if (!walletData) {
        throw new Error('请先创建或导入钱包');
      }

      const networkConfig = this.networks[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const wallet = new ethers.Wallet(walletData.privateKey, provider);

      const usdcABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)"
      ];

      const usdcContract = new ethers.Contract(networkConfig.usdcAddress, usdcABI, wallet);
      const decimals = await usdcContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // 估算gas
      const gasEstimate = await usdcContract.transfer.estimateGas(toAddress, amountWei);
      
      // 获取当前gas价格
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // 计算总费用
      const totalFee = gasEstimate * gasPrice;
      const feeInEth = ethers.formatEther(totalFee);

      return {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        totalFee: feeInEth,
        currency: 'ETH'
      };

    } catch (error) {
      console.error('估算交易费用失败:', error);
      throw new Error('估算交易费用失败: ' + error.message);
    }
  }

  // 验证交易地址
  validateAddress(address) {
    return WalletService.isValidAddress(address);
  }

  // 获取支持的网络列表
  getSupportedNetworks() {
    return Object.keys(this.networks).map(key => ({
      key,
      ...this.networks[key]
    }));
  }
}

export default new TransactionService();

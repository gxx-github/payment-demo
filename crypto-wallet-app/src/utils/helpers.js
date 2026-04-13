import { ethers } from 'ethers';

// 地址格式化工具
export const formatAddress = (address, startLength = 6, endLength = 4) => {
  if (!address || address.length < startLength + endLength) {
    return address || '';
  }
  
  const start = address.substring(0, startLength);
  const end = address.substring(address.length - endLength);
  return `${start}...${end}`;
};

// 验证以太坊地址
export const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

// 验证私钥格式
export const isValidPrivateKey = (privateKey) => {
  try {
    // 移除0x前缀（如果有）
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    return cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey);
  } catch (error) {
    return false;
  }
};

// 金额格式化
export const formatAmount = (amount, decimals = 6, symbol = 'USDC') => {
  if (!amount || isNaN(amount)) return '0.00';
  
  const num = parseFloat(amount);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals
  });
  
  return `${formatted} ${symbol}`;
};

// 科学计数法转换
export const formatScientificNotation = (amount) => {
  if (!amount || isNaN(amount)) return '0';
  
  const num = parseFloat(amount);
  if (num === 0) return '0';
  
  if (Math.abs(num) < 0.000001) {
    return num.toExponential(2);
  }
  
  return num.toString();
};

// 时间格式化
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }
  
  // 小于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 大于1天
  const days = Math.floor(diff / 86400000);
  if (days < 7) {
    return `${days}天前`;
  }
  
  // 显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 生成随机ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// 深拷贝对象
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 验证邮箱格式
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证手机号格式（中国）
export const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 生成助记词强度检查
export const checkMnemonicStrength = (mnemonic) => {
  if (!mnemonic) return { valid: false, message: '助记词不能为空' };
  
  const words = mnemonic.trim().split(/\s+/);
  
  if (words.length < 12) {
    return { valid: false, message: '助记词至少需要12个单词' };
  }
  
  if (words.length > 24) {
    return { valid: false, message: '助记词不能超过24个单词' };
  }
  
  if (words.length !== 12 && words.length !== 15 && words.length !== 18 && words.length !== 21 && words.length !== 24) {
    return { valid: false, message: '助记词长度必须是12、15、18、21或24个单词' };
  }
  
  return { valid: true, message: '助记词格式正确' };
};

// 计算交易费用（ETH）
export const calculateGasFee = (gasLimit, gasPrice) => {
  try {
    const gasLimitBN = BigInt(gasLimit);
    const gasPriceBN = BigInt(gasPrice);
    const fee = gasLimitBN * gasPriceBN;
    return ethers.formatEther(fee);
  } catch (error) {
    console.error('计算Gas费用失败:', error);
    return '0';
  }
};

// 网络名称映射
export const getNetworkName = (chainId) => {
  const networks = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    42: 'Kovan Testnet',
    56: 'BSC Mainnet',
    97: 'BSC Testnet',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai',
    42161: 'Arbitrum One',
    421611: 'Arbitrum Rinkeby'
  };
  
  return networks[chainId] || `Unknown Network (${chainId})`;
};

// 获取网络图标
export const getNetworkIcon = (chainId) => {
  const icons = {
    1: '🔷', // Ethereum
    56: '🟡', // BSC
    137: '🟣', // Polygon
    42161: '🔵' // Arbitrum
  };
  
  return icons[chainId] || '❓';
};

// 错误消息映射
export const getErrorMessage = (error) => {
  const errorMessages = {
    'INSUFFICIENT_FUNDS': '余额不足',
    'INVALID_ADDRESS': '无效的地址',
    'INVALID_PRIVATE_KEY': '无效的私钥',
    'NETWORK_ERROR': '网络连接错误',
    'TRANSACTION_FAILED': '交易失败',
    'GAS_ESTIMATION_FAILED': 'Gas估算失败',
    'USER_REJECTED': '用户取消操作',
    'UNKNOWN_ERROR': '未知错误'
  };
  
  // 尝试从错误消息中提取关键信息
  const errorString = error.toString().toLowerCase();
  
  if (errorString.includes('insufficient funds')) return errorMessages.INSUFFICIENT_FUNDS;
  if (errorString.includes('invalid address')) return errorMessages.INVALID_ADDRESS;
  if (errorString.includes('invalid private key')) return errorMessages.INVALID_PRIVATE_KEY;
  if (errorString.includes('network')) return errorMessages.NETWORK_ERROR;
  if (errorString.includes('gas')) return errorMessages.GAS_ESTIMATION_FAILED;
  if (errorString.includes('user rejected')) return errorMessages.USER_REJECTED;
  
  return errorMessages.UNKNOWN_ERROR;
};

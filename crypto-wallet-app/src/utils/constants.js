// 应用常量配置
export const APP_CONFIG = {
  name: 'Crypto Wallet',
  version: '1.0.0',
  supportEmail: 'support@cryptowallet.com',
  website: 'https://cryptowallet.com',
  github: 'https://github.com/cryptowallet/app'
};

// 网络配置
export const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://etherscan.io',
    usdcAddress: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C', // 需要替换为真实USDC地址
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    icon: '🔷',
    color: '#627EEA'
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    usdcAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    icon: '🟣',
    color: '#8247E5'
  },
  bsc: {
    name: 'BSC',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    icon: '🟡',
    color: '#F3BA2F'
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    usdcAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    icon: '🔵',
    color: '#28A0F0'
  }
};

// 默认网络
export const DEFAULT_NETWORK = 'ethereum';

// 支持的货币
export const SUPPORTED_CURRENCIES = {
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    icon: '💵',
    color: '#2775CA'
  },
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    icon: '🔷',
    color: '#627EEA'
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    icon: '🟢',
    color: '#26A17B'
  }
};

// 交易状态
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// 交易状态显示
export const TRANSACTION_STATUS_LABELS = {
  [TRANSACTION_STATUS.PENDING]: '处理中',
  [TRANSACTION_STATUS.CONFIRMED]: '已确认',
  [TRANSACTION_STATUS.FAILED]: '失败',
  [TRANSACTION_STATUS.CANCELLED]: '已取消'
};

// 交易状态颜色
export const TRANSACTION_STATUS_COLORS = {
  [TRANSACTION_STATUS.PENDING]: '#FFA500',
  [TRANSACTION_STATUS.CONFIRMED]: '#4CAF50',
  [TRANSACTION_STATUS.FAILED]: '#F44336',
  [TRANSACTION_STATUS.CANCELLED]: '#9E9E9E'
};

// 二维码类型
export const QR_TYPES = {
  WALLET_ADDRESS: 'wallet_address',
  USDC_TRANSFER: 'usdc_transfer',
  ETHEREUM: 'ethereum',
  PAYMENT_REQUEST: 'payment_request'
};

// 存储键名
export const STORAGE_KEYS = {
  WALLET_DATA: 'crypto_wallet_data',
  USER_SETTINGS: 'user_settings',
  TRANSACTION_HISTORY: 'transaction_history',
  FAVORITE_ADDRESSES: 'favorite_addresses',
  NETWORK_SETTINGS: 'network_settings'
};

// API配置
export const API_CONFIG = {
  baseUrl: 'https://api.cryptowallet.com', // 需要替换为真实API地址
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// 安全配置
export const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
  sessionTimeout: 30 * 60 * 1000, // 30分钟
  minPasswordLength: 8,
  requireBiometric: false
};

// UI配置
export const UI_CONFIG = {
  colors: {
    primary: '#2196F3',
    secondary: '#FFC107',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24
  }
};

// 验证规则
export const VALIDATION_RULES = {
  address: {
    minLength: 42,
    maxLength: 42,
    pattern: /^0x[a-fA-F0-9]{40}$/
  },
  privateKey: {
    minLength: 64,
    maxLength: 64,
    pattern: /^[a-fA-F0-9]{64}$/
  },
  mnemonic: {
    minWords: 12,
    maxWords: 24,
    validWordCounts: [12, 15, 18, 21, 24]
  },
  amount: {
    min: 0.000001,
    max: 1000000,
    decimals: 6
  }
};

// 错误代码
export const ERROR_CODES = {
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
  INVALID_MNEMONIC: 'INVALID_MNEMONIC',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  USER_REJECTED: 'USER_REJECTED',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// 错误消息
export const ERROR_MESSAGES = {
  [ERROR_CODES.INSUFFICIENT_FUNDS]: '余额不足，请检查您的账户余额',
  [ERROR_CODES.INVALID_ADDRESS]: '无效的地址格式',
  [ERROR_CODES.INVALID_PRIVATE_KEY]: '无效的私钥格式',
  [ERROR_CODES.INVALID_MNEMONIC]: '无效的助记词格式',
  [ERROR_CODES.NETWORK_ERROR]: '网络连接错误，请检查您的网络设置',
  [ERROR_CODES.TRANSACTION_FAILED]: '交易失败，请重试',
  [ERROR_CODES.GAS_ESTIMATION_FAILED]: 'Gas费用估算失败',
  [ERROR_CODES.USER_REJECTED]: '用户取消操作',
  [ERROR_CODES.WALLET_NOT_FOUND]: '未找到钱包，请先创建或导入钱包',
  [ERROR_CODES.UNAUTHORIZED]: '未授权访问，请重新登录',
  [ERROR_CODES.FORBIDDEN]: '禁止访问，权限不足',
  [ERROR_CODES.NOT_FOUND]: '请求的资源不存在',
  [ERROR_CODES.SERVER_ERROR]: '服务器内部错误，请稍后重试',
  [ERROR_CODES.UNKNOWN_ERROR]: '发生未知错误，请重试'
};

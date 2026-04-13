// 钱包数据类型
export const WalletData = {
  address: String,
  privateKey: String,
  mnemonic: String,
  publicKey: String,
  createdAt: String
};

// 交易数据类型
export const TransactionData = {
  hash: String,
  from: String,
  to: String,
  amount: String,
  currency: String,
  status: String, // 'pending', 'confirmed', 'failed'
  timestamp: String,
  blockNumber: Number,
  gasUsed: String,
  network: String
};

// 网络配置类型
export const NetworkConfig = {
  name: String,
  rpcUrl: String,
  chainId: Number,
  usdcAddress: String,
  explorerUrl: String,
  nativeCurrency: {
    name: String,
    symbol: String,
    decimals: Number
  }
};

// 二维码数据类型
export const QRData = {
  type: String, // 'wallet_address', 'usdc_transfer', 'ethereum'
  address: String,
  amount: String,
  memo: String,
  timestamp: String
};

// 用户设置类型
export const UserSettings = {
  defaultNetwork: String,
  currency: String, // 'USD', 'CNY', 'EUR'
  language: String,
  notifications: Boolean,
  biometricAuth: Boolean
};

// API响应类型
export const APIResponse = {
  success: Boolean,
  data: Object,
  message: String,
  error: String
};

// 支持的货币类型
export const SUPPORTED_CURRENCIES = ['USDC', 'ETH', 'USDT'];

// 支持的网络类型
export const SUPPORTED_NETWORKS = ['ethereum', 'polygon', 'bsc', 'arbitrum'];

// 交易状态
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
};

// 二维码类型
export const QR_TYPES = {
  WALLET_ADDRESS: 'wallet_address',
  USDC_TRANSFER: 'usdc_transfer',
  ETHEREUM: 'ethereum'
};

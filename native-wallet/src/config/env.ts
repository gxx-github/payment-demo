/**
 * 环境配置文件
 * 注意：在生产环境中使用 .env 文件配置
 */

// 开发环境默认配置
const DEFAULT_CONFIG = {
  WS_URL: 'wss://localhost:8080/ws',
  ETHEREUM_RPC_URL: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  ETHEREUM_TESTNET_RPC_URL: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  BSC_RPC_URL: 'https://bsc-dataseed1.binance.org',
  BSC_TESTNET_RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  POLYGON_RPC_URL: 'https://polygon-rpc.com',
  POLYGON_TESTNET_RPC_URL: 'https://rpc-mumbai.maticvigil.com',
  ARBITRUM_RPC_URL: 'https://arb1.arbitrum.io/rpc',
  OPTIMISM_RPC_URL: 'https://mainnet.optimism.io',
  SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  SOLANA_TESTNET_RPC_URL: 'https://api.testnet.solana.com',
  SOLANA_DEVNET_RPC_URL: 'https://api.devnet.solana.com',
  API_BASE_URL: 'http://localhost:3000/api',
  APP_ENV: 'development',
  ENABLE_TESTNET: true,
};

// 尝试从环境变量加载配置，如果不存在则使用默认值
export const ENV = {
  WS_URL: process.env.WS_URL || DEFAULT_CONFIG.WS_URL,
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || DEFAULT_CONFIG.ETHEREUM_RPC_URL,
  ETHEREUM_TESTNET_RPC_URL: process.env.ETHEREUM_TESTNET_RPC_URL || DEFAULT_CONFIG.ETHEREUM_TESTNET_RPC_URL,
  BSC_RPC_URL: process.env.BSC_RPC_URL || DEFAULT_CONFIG.BSC_RPC_URL,
  BSC_TESTNET_RPC_URL: process.env.BSC_TESTNET_RPC_URL || DEFAULT_CONFIG.BSC_TESTNET_RPC_URL,
  POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || DEFAULT_CONFIG.POLYGON_RPC_URL,
  POLYGON_TESTNET_RPC_URL: process.env.POLYGON_TESTNET_RPC_URL || DEFAULT_CONFIG.POLYGON_TESTNET_RPC_URL,
  ARBITRUM_RPC_URL: process.env.ARBITRUM_RPC_URL || DEFAULT_CONFIG.ARBITRUM_RPC_URL,
  OPTIMISM_RPC_URL: process.env.OPTIMISM_RPC_URL || DEFAULT_CONFIG.OPTIMISM_RPC_URL,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || DEFAULT_CONFIG.SOLANA_RPC_URL,
  SOLANA_TESTNET_RPC_URL: process.env.SOLANA_TESTNET_RPC_URL || DEFAULT_CONFIG.SOLANA_TESTNET_RPC_URL,
  SOLANA_DEVNET_RPC_URL: process.env.SOLANA_DEVNET_RPC_URL || DEFAULT_CONFIG.SOLANA_DEVNET_RPC_URL,
  API_BASE_URL: process.env.API_BASE_URL || DEFAULT_CONFIG.API_BASE_URL,
  APP_ENV: process.env.APP_ENV || DEFAULT_CONFIG.APP_ENV,
  ENABLE_TESTNET: process.env.ENABLE_TESTNET === 'true' || DEFAULT_CONFIG.ENABLE_TESTNET,
};


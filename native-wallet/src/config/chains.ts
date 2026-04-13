import { ENV } from './env';

export type ChainType = 'EVM' | 'SOLANA';

export interface ChainConfig {
  chainId: number | string;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  isTestnet: boolean;
  type: ChainType;
}

/**
 * 支持的区块链配置
 */
export const SUPPORTED_CHAINS: ChainConfig[] = [
  // EVM 链
  {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: ENV.ETHEREUM_RPC_URL,
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
    type: 'EVM',
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: ENV.BSC_RPC_URL,
    blockExplorerUrl: 'https://bscscan.com',
    isTestnet: false,
    type: 'EVM',
  },
  {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: ENV.POLYGON_RPC_URL,
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    type: 'EVM',
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: ENV.ARBITRUM_RPC_URL,
    blockExplorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    type: 'EVM',
  },
  {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: ENV.OPTIMISM_RPC_URL,
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    type: 'EVM',
  },
  // Solana 主网
  {
    chainId: 'solana-mainnet',
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: ENV.SOLANA_RPC_URL,
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: false,
    type: 'SOLANA',
  },
  // 测试网络
  {
    chainId: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: ENV.ETHEREUM_TESTNET_RPC_URL,
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    type: 'EVM',
  },
  {
    chainId: 97,
    name: 'BSC Testnet',
    symbol: 'BNB',
    rpcUrl: ENV.BSC_TESTNET_RPC_URL,
    blockExplorerUrl: 'https://testnet.bscscan.com',
    isTestnet: true,
    type: 'EVM',
  },
  {
    chainId: 80001,
    name: 'Mumbai',
    symbol: 'MATIC',
    rpcUrl: ENV.POLYGON_TESTNET_RPC_URL,
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    isTestnet: true,
    type: 'EVM',
  },
  {
    chainId: 'solana-testnet',
    name: 'Solana Testnet',
    symbol: 'SOL',
    rpcUrl: ENV.SOLANA_TESTNET_RPC_URL,
    blockExplorerUrl: 'https://explorer.solana.com/?cluster=testnet',
    isTestnet: true,
    type: 'SOLANA',
  },
  {
    chainId: 'solana-devnet',
    name: 'Solana Devnet',
    symbol: 'SOL',
    rpcUrl: ENV.SOLANA_DEVNET_RPC_URL,
    blockExplorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    isTestnet: true,
    type: 'SOLANA',
  },
];

/**
 * 根据 chainId 获取链配置
 */
export const getChainConfig = (chainId: number | string): ChainConfig | undefined => {
  return SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
};

/**
 * 获取所有主网链
 */
export const getMainnetChains = (): ChainConfig[] => {
  const chains = SUPPORTED_CHAINS.filter(chain => !chain.isTestnet);
  return ENV.ENABLE_TESTNET ? SUPPORTED_CHAINS : chains;
};

/**
 * 获取所有测试网链
 */
export const getTestnetChains = (): ChainConfig[] => {
  return SUPPORTED_CHAINS.filter(chain => chain.isTestnet);
};

/**
 * 获取所有 EVM 链
 */
export const getEVMChains = (): ChainConfig[] => {
  return SUPPORTED_CHAINS.filter(chain => chain.type === 'EVM');
};

/**
 * 获取所有 Solana 链
 */
export const getSolanaChains = (): ChainConfig[] => {
  return SUPPORTED_CHAINS.filter(chain => chain.type === 'SOLANA');
};

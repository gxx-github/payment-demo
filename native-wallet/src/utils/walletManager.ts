import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSolanaWalletFromMnemonic, SolanaWallet } from './solanaWallet';
import { ChainType } from '../config/chains';

export interface Wallet {
  address: string;
  privateKey: string;
  mnemonic: string;
  chainId: number | string;
  chainName: string;
  chainType: ChainType;
  publicKey?: string; // For Solana
}

export interface WalletStorage {
  wallets: Wallet[];
  currentWalletIndex: number;
}

const WALLET_STORAGE_KEY = '@native_wallet_storage';

/**
 * 生成助记词
 */
export const generateMnemonic = (): string => {
  return bip39.generateMnemonic(128); // 12个单词
};

/**
 * 从助记词创建 EVM 钱包
 */
export const createEVMWalletFromMnemonic = async (
  mnemonic: string,
  chainId: number = 1,
  chainName: string = 'Ethereum',
): Promise<Wallet> => {
  // 验证助记词
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  // 使用 ethers.js 从助记词创建钱包
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const wallet = hdNode.derivePath("m/44'/60'/0'/0/0"); // 标准以太坊派生路径

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic,
    chainId: chainId,
    chainName: chainName,
    chainType: 'EVM',
  };
};

/**
 * 从助记词创建钱包（支持多链类型）
 */
export const createWalletFromMnemonic = async (
  mnemonic: string,
  chainId: number | string,
  chainName: string,
  chainType: ChainType = 'EVM',
): Promise<Wallet> => {
  if (chainType === 'SOLANA') {
    const solanaWallet = await createSolanaWalletFromMnemonic(
      mnemonic,
      chainId as string,
      chainName,
    );
    return {
      ...solanaWallet,
      chainType: 'SOLANA',
    };
  } else {
    return await createEVMWalletFromMnemonic(mnemonic, chainId as number, chainName);
  }
};

/**
 * 创建新钱包
 */
export const createNewWallet = async (
  chainId: number | string = 1,
  chainName: string = 'Ethereum',
  chainType: ChainType = 'EVM',
): Promise<Wallet> => {
  const mnemonic = generateMnemonic();
  return await createWalletFromMnemonic(mnemonic, chainId, chainName, chainType);
};

/**
 * 从同一助记词为不同链创建钱包
 */
export const deriveWalletForChain = async (
  mnemonic: string,
  chainId: number | string,
  chainName: string,
  chainType: ChainType,
): Promise<Wallet> => {
  return await createWalletFromMnemonic(mnemonic, chainId, chainName, chainType);
};

/**
 * 保存钱包到本地存储
 */
export const saveWallet = async (wallet: Wallet): Promise<void> => {
  try {
    const storageData = await getWalletStorage();
    storageData.wallets.push(wallet);
    storageData.currentWalletIndex = storageData.wallets.length - 1;
    await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Error saving wallet:', error);
    throw error;
  }
};

/**
 * 获取所有钱包
 */
export const getWalletStorage = async (): Promise<WalletStorage> => {
  try {
    const data = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return { wallets: [], currentWalletIndex: -1 };
  } catch (error) {
    console.error('Error getting wallets:', error);
    return { wallets: [], currentWalletIndex: -1 };
  }
};

/**
 * 获取当前钱包
 */
export const getCurrentWallet = async (): Promise<Wallet | null> => {
  try {
    const storage = await getWalletStorage();
    if (storage.currentWalletIndex >= 0 && storage.wallets.length > 0) {
      return storage.wallets[storage.currentWalletIndex];
    }
    return null;
  } catch (error) {
    console.error('Error getting current wallet:', error);
    return null;
  }
};

/**
 * 根据链 ID 获取钱包
 */
export const getWalletByChain = async (
  chainId: number | string,
): Promise<Wallet | null> => {
  try {
    const storage = await getWalletStorage();
    return storage.wallets.find(w => w.chainId === chainId) || null;
  } catch (error) {
    console.error('Error getting wallet by chain:', error);
    return null;
  }
};

/**
 * 切换当前钱包
 */
export const switchWallet = async (index: number): Promise<void> => {
  try {
    const storage = await getWalletStorage();
    if (index >= 0 && index < storage.wallets.length) {
      storage.currentWalletIndex = index;
      await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(storage));
    } else {
      throw new Error('Invalid wallet index');
    }
  } catch (error) {
    console.error('Error switching wallet:', error);
    throw error;
  }
};

/**
 * 导入钱包（通过助记词）
 */
export const importWalletFromMnemonic = async (
  mnemonic: string,
  chainId: number | string = 1,
  chainName: string = 'Ethereum',
  chainType: ChainType = 'EVM',
): Promise<Wallet> => {
  const wallet = await createWalletFromMnemonic(mnemonic, chainId, chainName, chainType);
  await saveWallet(wallet);
  return wallet;
};

/**
 * 检查是否已有钱包
 */
export const hasWallet = async (): Promise<boolean> => {
  const storage = await getWalletStorage();
  return storage.wallets.length > 0;
};

/**
 * 从同一助记词创建多链钱包
 */
export const createMultiChainWallets = async (
  mnemonic: string,
  chains: Array<{chainId: number | string; chainName: string; chainType: ChainType}>,
): Promise<Wallet[]> => {
  const wallets: Wallet[] = [];
  
  for (const chain of chains) {
    const wallet = await deriveWalletForChain(
      mnemonic,
      chain.chainId,
      chain.chainName,
      chain.chainType,
    );
    await saveWallet(wallet);
    wallets.push(wallet);
  }
  
  return wallets;
};

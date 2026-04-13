import { ethers } from 'ethers';
import { getChainConfig } from '../config/chains';

export interface TransactionParams {
  to: string;
  value: string; // in ETH or native token
  data?: string;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  status?: number;
}

/**
 * 获取区块链提供者
 */
export const getProvider = (chainId: number): ethers.JsonRpcProvider => {
  const chainConfig = getChainConfig(chainId);
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return new ethers.JsonRpcProvider(chainConfig.rpcUrl);
};

/**
 * 获取钱包余额
 */
export const getBalance = async (
  address: string,
  chainId: number,
): Promise<string> => {
  try {
    const provider = getProvider(chainId);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
};

/**
 * 发送交易
 */
export const sendTransaction = async (
  privateKey: string,
  chainId: number,
  params: TransactionParams,
): Promise<TransactionResult> => {
  try {
    const provider = getProvider(chainId);
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to: params.to,
      value: ethers.parseEther(params.value),
      data: params.data,
    });

    const receipt = await tx.wait();

    return {
      hash: tx.hash,
      from: tx.from,
      to: params.to,
      value: params.value,
      gasUsed: receipt?.gasUsed.toString(),
      status: receipt?.status,
    };
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

/**
 * 获取交易历史（简化版本，实际应该从后端获取）
 */
export const getTransactionHistory = async (
  address: string,
  chainId: number,
): Promise<any[]> => {
  // 这里应该调用后端 API 获取交易历史
  // 暂时返回空数组
  return [];
};

/**
 * 估算 Gas 费用
 */
export const estimateGas = async (
  from: string,
  to: string,
  value: string,
  chainId: number,
): Promise<string> => {
  try {
    const provider = getProvider(chainId);
    const gasEstimate = await provider.estimateGas({
      from,
      to,
      value: ethers.parseEther(value),
    });
    return ethers.formatEther(gasEstimate);
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

/**
 * 获取当前 Gas 价格
 */
export const getGasPrice = async (chainId: number): Promise<string> => {
  try {
    const provider = getProvider(chainId);
    const feeData = await provider.getFeeData();
    if (feeData.gasPrice) {
      return ethers.formatUnits(feeData.gasPrice, 'gwei');
    }
    return '0';
  } catch (error) {
    console.error('Error getting gas price:', error);
    throw error;
  }
};


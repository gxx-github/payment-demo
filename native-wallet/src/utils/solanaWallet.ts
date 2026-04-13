import * as bip39 from 'bip39';
import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';

export interface SolanaWallet {
  address: string;
  privateKey: string;
  publicKey: string;
  mnemonic: string;
  chainId: string;
  chainName: string;
}

/**
 * 从助记词创建 Solana 钱包
 */
export const createSolanaWalletFromMnemonic = async (
  mnemonic: string,
  chainId: string = 'solana-mainnet',
  chainName: string = 'Solana',
): Promise<SolanaWallet> => {
  // 验证助记词
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  // 从助记词生成种子
  const seed = await bip39.mnemonicToSeed(mnemonic);
  
  // 使用 Solana 标准派生路径: m/44'/501'/0'/0'
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
  
  // 创建密钥对
  const keypair = Keypair.fromSeed(derivedSeed);

  return {
    address: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
    publicKey: keypair.publicKey.toBase58(),
    mnemonic: mnemonic,
    chainId: chainId,
    chainName: chainName,
  };
};

/**
 * 创建新的 Solana 钱包
 */
export const createNewSolanaWallet = async (
  chainId: string = 'solana-mainnet',
  chainName: string = 'Solana',
): Promise<SolanaWallet> => {
  const mnemonic = bip39.generateMnemonic(128);
  return await createSolanaWalletFromMnemonic(mnemonic, chainId, chainName);
};

/**
 * 从私钥恢复钱包
 */
export const restoreSolanaWalletFromPrivateKey = (
  privateKey: string,
  chainId: string = 'solana-mainnet',
  chainName: string = 'Solana',
): SolanaWallet => {
  const secretKey = bs58.decode(privateKey);
  const keypair = Keypair.fromSecretKey(secretKey);

  return {
    address: keypair.publicKey.toBase58(),
    privateKey: privateKey,
    publicKey: keypair.publicKey.toBase58(),
    mnemonic: '', // 从私钥恢复时没有助记词
    chainId: chainId,
    chainName: chainName,
  };
};

/**
 * 获取 Solana 余额
 */
export const getSolanaBalance = async (
  address: string,
  rpcUrl: string,
): Promise<string> => {
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return (balance / LAMPORTS_PER_SOL).toString();
  } catch (error) {
    console.error('Error getting Solana balance:', error);
    throw error;
  }
};

/**
 * 发送 SOL
 */
export const sendSolana = async (
  privateKey: string,
  toAddress: string,
  amount: number,
  rpcUrl: string,
): Promise<string> => {
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const secretKey = bs58.decode(privateKey);
    const fromKeypair = Keypair.fromSecretKey(secretKey);
    const toPublicKey = new PublicKey(toAddress);

    const transaction = await connection.sendTransaction(
      new (await import('@solana/web3.js')).Transaction().add(
        (await import('@solana/web3.js')).SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports: amount * LAMPORTS_PER_SOL,
        }),
      ),
      [fromKeypair],
    );

    await connection.confirmTransaction(transaction);
    return transaction;
  } catch (error) {
    console.error('Error sending Solana:', error);
    throw error;
  }
};


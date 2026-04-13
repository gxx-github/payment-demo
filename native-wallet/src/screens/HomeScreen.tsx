import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../styles/colors';
import { getCurrentWallet, getWalletStorage, Wallet } from '../utils/walletManager';
import { getBalance } from '../utils/blockchain';
import { getSolanaBalance } from '../utils/solanaWallet';
import { getChainConfig } from '../config/chains';

export const HomeScreen: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [allWallets, setAllWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const currentWallet = await getCurrentWallet();
      const storage = await getWalletStorage();
      
      if (currentWallet) {
        setWallet(currentWallet);
        setAllWallets(storage.wallets);
        await loadBalance(currentWallet);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const loadBalance = async (w: Wallet) => {
    try {
      setLoading(true);
      const chainConfig = getChainConfig(w.chainId);
      
      if (!chainConfig) {
        return;
      }

      let bal = '0.00';
      if (w.chainType === 'SOLANA') {
        bal = await getSolanaBalance(w.address, chainConfig.rpcUrl);
      } else {
        bal = await getBalance(w.address, w.chainId as number);
      }
      
      setBalance(parseFloat(bal).toFixed(4));
    } catch (error) {
      console.error('Error loading balance:', error);
      Alert.alert('提示', '获取余额失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    if (wallet) {
      loadBalance(wallet);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <Text style={styles.greeting}>欢迎回来 👋</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {wallet && (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>总余额</Text>
              <Text style={styles.balanceAmount}>
                {balance} {wallet.chainName === 'Solana' ? 'SOL' : getChainConfig(wallet.chainId)?.symbol}
              </Text>
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>地址：</Text>
                <Text style={styles.addressText}>{formatAddress(wallet.address)}</Text>
              </View>
              <View style={styles.chainBadge}>
                <Text style={styles.chainBadgeText}>{wallet.chainName}</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <ActionButton icon="📤" label="发送" onPress={() => {}} />
              <ActionButton icon="📥" label="接收" onPress={() => {}} />
              <ActionButton icon="🔄" label="交换" onPress={() => {}} />
              <ActionButton icon="📊" label="历史" onPress={() => {}} />
            </View>

            <View style={styles.walletsContainer}>
              <Text style={styles.sectionTitle}>我的钱包</Text>
              {allWallets.map((w, index) => (
                <WalletCard
                  key={index}
                  wallet={w}
                  isActive={w.address === wallet.address}
                />
              ))}
            </View>
          </>
        )}

        {!wallet && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>未找到钱包</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

interface WalletCardProps {
  wallet: Wallet;
  isActive: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, isActive }) => (
  <View style={[styles.walletCard, isActive && styles.walletCardActive]}>
    <View style={styles.walletCardContent}>
      <Text style={styles.walletCardChain}>{wallet.chainName}</Text>
      <Text style={styles.walletCardAddress}>
        {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
      </Text>
    </View>
    {isActive && (
      <View style={styles.activeBadge}>
        <Text style={styles.activeBadgeText}>当前</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.surface,
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 16,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 12,
    color: Colors.surface,
    opacity: 0.8,
  },
  addressText: {
    fontSize: 12,
    color: Colors.surface,
    fontWeight: '500',
  },
  chainBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chainBadgeText: {
    fontSize: 12,
    color: Colors.surface,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  walletsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  walletCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.transparent,
  },
  walletCardActive: {
    borderColor: Colors.primary,
  },
  walletCardContent: {
    flex: 1,
  },
  walletCardChain: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  walletCardAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 12,
    color: Colors.surface,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});


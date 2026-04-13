import React, { useState } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
    ConnectionProvider,
    WalletProvider,
    useConnection,
    useWallet
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const network = WalletAdapterNetwork.Mainnet;
const endpoint = 'https://mainnet.helius-rpc.com/?api-key=c872a6f0-6f80-4144-9cf6-ffbe1f371a5b';
const connection = new Connection(endpoint);

const wallets = [new PhantomWalletAdapter()];

/**
 * 浏览器兼容：base64 转 Uint8Array（替换 Buffer.from）
 * @param {string} base64 - base64 字符串
 * @returns {Uint8Array}
 */
function base64ToBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * 浏览器兼容：Uint8Array 转 base64（替换 .toString('base64')）
 * @param {Uint8Array} buffer - Uint8Array
 * @returns {string}
 */
function bufferToBase64(buffer) {
    const binaryString = String.fromCharCode(...buffer);
    return btoa(binaryString);
}

function WalletTest() {
    const { connection } = useConnection();
    const { publicKey, signTransaction, connected } = useWallet();
    const [status, setStatus] = useState('未连接钱包');
    const [loading, setLoading] = useState(false);
    const [memo, setMemo] = useState('');

    const handleTestButton = async () => {
        if (!connected || !publicKey) {
            setStatus('请先连接钱包');
            return;
        }

        setLoading(true);
        setStatus('模拟商家推送 0.1 USDC 交易中...（使用已知地址，主网）');

        try {
            const response = await fetch('http://localhost:3001/api/construct-tx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memo: memo.trim() || undefined  // 如果 memo 为空，不传递或传递 undefined
                }),
            });

            const { serializedTx, userPubkey, userATA, targetATA } = await response.json();
            if (!serializedTx) throw new Error('构造失败');

            if (publicKey.toString() !== userPubkey) {
                throw new Error('钱包地址与商家已知地址不匹配！');
            }

            // 检查用户 USDC 余额（≥0.1）
            const userATAPubkey = new PublicKey(userATA);
            const userBalance = await connection.getTokenAccountBalance(userATAPubkey);
            if (parseInt(userBalance.value.amount) < 100_000) {
                throw new Error('用户 USDC 余额不足 0.1 USDC！');
            }

            setStatus('请在 Phantom 中确认 0.1 USDC 转账...');

            // 步骤2: 反序列化（用浏览器兼容解码）
            const txBytes = base64ToBuffer(serializedTx);
            const tx = Transaction.from(txBytes);

            const signedTx = await signTransaction(tx);  // Phantom 签名

            // 步骤3: 部分序列化（requireAllSignatures: false）
            const signedSerializedTx = bufferToBase64(signedTx.serialize({ requireAllSignatures: false }));

            const sponsorResponse = await fetch('http://localhost:3001/api/sponsor-tx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serializedTx: signedSerializedTx }),
            });

            const { signature, explorerUrl } = await sponsorResponse.json();

            setStatus(`0.1 USDC 转账成功！签名: ${signature} (Gas 已赞助)`);
            window.open(explorerUrl, '_blank');
        } catch (error) {
            setStatus(`错误: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h1>Solana USDC Fee Payer 测试（主网 0.1U）</h1>
            <WalletMultiButton />
            <p>状态: {status}</p>
            
            <div style={{ margin: '20px 0', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Memo（可选）:
                </label>
                <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="输入备注信息（如：订单号 123456）"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        boxSizing: 'border-box'
                    }}
                />
                <p style={{ fontSize: '11px', color: '#999', marginTop: '5px', marginBottom: 0 }}>
                    注意：Phantom 钱包界面不会显示 memo，但会在区块链上记录
                </p>
            </div>
            
            <button
                onClick={handleTestButton}
                disabled={!connected || loading}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    background: '#9945FF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: connected ? 'pointer' : 'not-allowed',
                    width: '100%',
                    marginTop: '10px'
                }}
            >
                {loading ? '处理中...' : '测试按钮（转 0.1 USDC，Gas 免费）'}
            </button>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
                提示：确保 Phantom 有 ≥0.1 USDC + 尘埃 SOL，且地址匹配 .env。收款地址: .env 中的 TARGET_PUBLIC_KEY
            </p>
        </div>
    );
}

function App() {
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletTest />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
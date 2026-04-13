import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Card, CardTitle, Input, Helper, PrimaryButton } from './styled/Layout.jsx';

function TransferForm({ connection }) {
    const { publicKey, signTransaction, connected } = useWallet();
    const [to, setTo] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!connected || !publicKey) { setStatus('Please connect your wallet first'); return; }
        try {
            setLoading(true);
            setStatus('Creating transaction…');
            const toPk = new PublicKey(to);
            const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
            if (!Number.isFinite(lamports) || lamports <= 0) throw new Error('Invalid amount');

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            const tx = new Transaction();
            tx.feePayer = publicKey;
            tx.recentBlockhash = latestBlockhash.blockhash;
            tx.add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: toPk, lamports }));

            const signed = await signTransaction(tx);
            setStatus('Sending transaction…');
            const sig = await connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                maxRetries: 3,
            });
            await connection.confirmTransaction(sig, 'confirmed');
            setStatus(`Sent: ${sig}`);
        } catch (err) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardTitle>Transfer SOL</CardTitle>
            {!connected ? (
                <Helper>Wallet not connected</Helper>
            ) : (
                <form onSubmit={onSubmit}>
                    <Input placeholder="Recipient address" value={to} onChange={e => setTo(e.target.value)} />
                    <div style={{ height: 8 }} />
                    <Input placeholder="Amount (SOL)" value={amount} onChange={e => setAmount(e.target.value)} />
                    <div style={{ height: 10 }} />
                    <PrimaryButton type="submit" disabled={loading || !to || !amount}>{loading ? 'Processing…' : 'Transfer'}</PrimaryButton>
                    <div style={{ height: 8 }} />
                    <Helper>{status}</Helper>
                </form>
            )}
        </Card>
    );
}

export default TransferForm;



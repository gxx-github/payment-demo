import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Card, CardTitle, Label, Value, Helper, PrimaryButton } from './styled/Layout.jsx';

function BalancePanel({ connection }) {
    const { publicKey, connected } = useWallet();
    const [sol, setSol] = useState(null);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        if (!connected || !publicKey) return;
        setLoading(true);
        try {
            const lamports = await connection.getBalance(new PublicKey(publicKey));
            setSol(lamports / LAMPORTS_PER_SOL);
        } catch (e) {
            setSol(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey, connected]);

    return (
        <Card>
            <CardTitle>Balance (SOL)</CardTitle>
            {connected ? (
                <>
                    <Label>Current</Label>
                    <Value>{sol === null ? '—' : sol}</Value>
                    <div style={{ height: 8 }} />
                    <PrimaryButton onClick={refresh} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </PrimaryButton>
                </>
            ) : (
                <Helper>Wallet not connected</Helper>
            )}
        </Card>
    );
}

export default BalancePanel;



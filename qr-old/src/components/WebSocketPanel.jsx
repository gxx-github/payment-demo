import React, { useEffect, useRef, useState } from 'react';
import { Card, CardTitle, Helper, PrimaryButton } from './styled/Layout.jsx';

function WebSocketPanel() {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const timerRef = useRef(null);

    const connect = () => {
        try {
            wsRef.current = new WebSocket('wss://example.com/mock');
        } catch (e) {
            wsRef.current = null;
        }
        setConnected(true);

        timerRef.current = setInterval(() => {
            const msg = { id: Date.now(), text: 'mock response at ' + new Date().toLocaleTimeString() };
            setMessages(prev => [msg, ...prev].slice(0, 20));
        }, 3000);
    };

    const disconnect = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (wsRef.current) { try { wsRef.current.close(); } catch (_) {} }
        timerRef.current = null;
        wsRef.current = null;
        setConnected(false);
    };

    useEffect(() => {
        return () => disconnect();
    }, []);

    return (
        <Card>
            <CardTitle>WebSocket (Mock 3s)</CardTitle>
            <div style={{ display: 'flex', gap: 8 }}>
                <PrimaryButton onClick={connected ? disconnect : connect}>
                    {connected ? 'Disconnect' : 'Connect'}
                </PrimaryButton>
                <PrimaryButton onClick={() => setMessages([])} disabled={!messages.length}>Clear</PrimaryButton>
            </div>
            <div style={{ height: 10 }} />
            {!connected && <Helper>Not connected</Helper>}
            <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #1f1f2b', borderRadius: 8, padding: 8 }}>
                {messages.map(m => (
                    <div key={m.id} style={{ fontSize: 12, color: '#cfd4e6', padding: '6px 0', borderBottom: '1px dashed #222' }}>
                        {m.text}
                    </div>
                ))}
                {!messages.length && <Helper>No messages yet</Helper>}
            </div>
        </Card>
    );
}

export default WebSocketPanel;



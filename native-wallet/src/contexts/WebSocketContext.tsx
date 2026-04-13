import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { wsService, WebSocketMessage, PaymentRequest } from '../services/websocket';
import { getCurrentWallet } from '../utils/walletManager';
import { ENV } from '../config/env';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    initWebSocket();

    return () => {
      wsService.disconnect();
    };
  }, []);

  const initWebSocket = async () => {
    try {
      const wallet = await getCurrentWallet();
      if (!wallet) {
        return;
      }

      // 连接到 WebSocket 服务器
      wsService.connect(ENV.WS_URL, wallet.address);

      // 添加消息处理器
      wsService.addMessageHandler(handleMessage);

      setIsConnected(true);
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    setLastMessage(message);

    switch (message.type) {
      case 'PAYMENT_REQUEST':
        handlePaymentRequest(message.data as PaymentRequest);
        break;
      case 'PAYMENT_CONFIRMED':
        handlePaymentConfirmed(message.data);
        break;
      case 'PAYMENT_FAILED':
        handlePaymentFailed(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const handlePaymentRequest = (paymentRequest: PaymentRequest) => {
    Alert.alert(
      '支付请求',
      `商家: ${paymentRequest.merchant}\n金额: ${paymentRequest.amount} ${paymentRequest.currency}\n描述: ${paymentRequest.description || '无'}`,
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: () => {
            wsService.send({
              type: 'PAYMENT_REJECTED',
              data: { requestId: paymentRequest.requestId },
              timestamp: Date.now(),
            });
          },
        },
        {
          text: '确认支付',
          onPress: () => {
            // 这里应该调用交易处理逻辑
            wsService.send({
              type: 'PAYMENT_ACCEPTED',
              data: { requestId: paymentRequest.requestId },
              timestamp: Date.now(),
            });
          },
        },
      ],
    );
  };

  const handlePaymentConfirmed = (data: any) => {
    Alert.alert('支付成功', `交易已确认\n交易哈希: ${data.txHash}`);
  };

  const handlePaymentFailed = (data: any) => {
    Alert.alert('支付失败', `原因: ${data.reason || '未知错误'}`);
  };

  const sendMessage = (message: WebSocketMessage) => {
    wsService.send(message);
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};


/**
 * 生成支付二维码数据
 */
export interface PaymentQRData {
  walletAddress: string;
  chainId: number;
  amount?: string;
  token?: string;
  timestamp: number;
}

/**
 * 将支付信息转换为二维码字符串
 */
export const generatePaymentQRString = (data: PaymentQRData): string => {
  return JSON.stringify(data);
};

/**
 * 解析二维码字符串
 */
export const parsePaymentQRString = (qrString: string): PaymentQRData => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    throw new Error('Invalid QR code data');
  }
};

/**
 * 验证二维码数据
 */
export const validateQRData = (data: PaymentQRData): boolean => {
  if (!data.walletAddress || !data.chainId) {
    return false;
  }
  
  // 验证地址格式（以太坊格式）
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(data.walletAddress)) {
    return false;
  }

  return true;
};


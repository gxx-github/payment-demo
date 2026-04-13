import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import QRCodeLib from 'qrcode';
import { UI_CONFIG } from '../utils/constants';

const QRCodeComponent = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  style = {},
  ...props
}) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState(null);
  const screenWidth = Dimensions.get('window').width;
  const maxSize = screenWidth - UI_CONFIG.spacing.xl * 2;
  const qrSize = Math.min(size, maxSize);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const dataURL = await QRCodeLib.toDataURL(value, {
          width: qrSize,
          margin: 2,
          color: {
            dark: color,
            light: backgroundColor
          }
        });
        setQrCodeDataURL(dataURL);
      } catch (error) {
        console.error('生成二维码失败:', error);
      }
    };

    if (value) {
      generateQRCode();
    }
  }, [value, qrSize, color, backgroundColor]);

  return (
    <View style={[styles.container, style]}>
      {qrCodeDataURL && (
        <Image
          source={{ uri: qrCodeDataURL }}
          style={[styles.qrCode, { width: qrSize, height: qrSize }]}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONFIG.spacing.md,
  },
  qrCode: {
    borderRadius: UI_CONFIG.borderRadius.md,
  },
});

export default QRCodeComponent;

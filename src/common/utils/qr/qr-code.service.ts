import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  async generateQrCodeBuffer(url: string): Promise<Buffer> {
    return await QRCode.toBuffer(url, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
  }

  async generateQrCodeDataUrl(url: string): Promise<string> {
    return await QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
    });
  }
}

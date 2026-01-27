import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class QrCodeService {
  private readonly qrDir = path.join(process.cwd(), 'public', 'qrcodes');

  constructor() {
    this.ensureQrDirectory();
  }

  private async ensureQrDirectory() {
    try {
      await fs.mkdir(this.qrDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create QR directory:', error);
    }
  }

  async generateQrCode(url: string, shortCode: string): Promise<string> {
    const filename = `${shortCode}.png`;
    const filePath = path.join(this.qrDir, filename);

    // Generate high-resolution QR code (1024x1024)
    await QRCode.toFile(filePath, url, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction
    });

    // Return public URL
    return `/qrcodes/${filename}`;
  }

  async generateQrCodeDataUrl(url: string): Promise<string> {
    // Generate as base64 data URL (for API responses)
    return await QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
    });
  }

  async deleteQrCode(shortCode: string): Promise<void> {
    const filePath = path.join(this.qrDir, `${shortCode}.png`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(error);
    }
  }
}

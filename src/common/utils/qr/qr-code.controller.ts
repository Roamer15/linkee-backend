import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { QrCodeService } from './qr-code.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from 'src/entities/link.entity';

@Controller('api/qr')
export class QrCodeController {
  constructor(
    private readonly qrCodeService: QrCodeService,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  @Get(':shortCode')
  async getQrCode(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
  ): Promise<void> {
    const link = await this.linkRepository.findOne({
      where: { shortCode },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    const fullUrl = `${process.env.BASE_URL}/${shortCode}`;
    const qrBuffer = await this.qrCodeService.generateQrCodeBuffer(fullUrl);

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': qrBuffer.length,
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    });

    res.send(qrBuffer);
  }

  @Get(':shortCode/data-url')
  async getQrCodeDataUrl(
    @Param('shortCode') shortCode: string,
  ): Promise<{ dataUrl: string }> {
    const link = await this.linkRepository.findOne({
      where: { shortCode },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    const fullUrl = `${process.env.BASE_URL}/${shortCode}`;
    const dataUrl = await this.qrCodeService.generateQrCodeDataUrl(fullUrl);

    return { dataUrl };
  }
}

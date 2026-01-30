import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from 'src/entities/link.entity';
import { LoggerService } from 'src/logger/logger.service';
import { Repository } from 'typeorm';
import { CreateLinkDto } from './dto/create-link.dto';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { customAlphabet } from 'nanoid';
import { QrCodeService } from 'src/common/utils/qr/qr-code.service';
import { MetadataExtractorService } from './services/metadata-extractor.service';

export interface LinkData {
  savedLink: Link;
  shortUrl: string;
}

@Injectable()
export class LinksService {
  private readonly generateShortCode: (size?: number) => string;
  private readonly SHORT_CODE_SET_KEY = 'shortcodes:used';

  constructor(
    @InjectRepository(Link)
    private linkRepository: Repository<Link>,
    @Inject('REDIS_CLIENT')
    private redisClient: Redis,
    private qrCodeService: QrCodeService,
    private metadataExtractorService: MetadataExtractorService,
    private logger: LoggerService,
  ) {
    const alphabet =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.generateShortCode = customAlphabet(alphabet, 6);
  }

  private async cacheLink(link: Link): Promise<void> {
    const cacheKey = `link:${link.shortCode}`;
    await this.redisClient.setex(cacheKey, 86400, JSON.stringify(link)); // 24h TTL
  }

  async createLink(dto: CreateLinkDto, userId: string): Promise<LinkData> {
    let shortCode!: string;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      shortCode = dto.customCode || this.generateShortCode();

      const exists = await this.redisClient.sismember(
        this.SHORT_CODE_SET_KEY,
        shortCode,
      );

      if (!exists) {
        const dbCheck = await this.linkRepository.findOne({
          where: { shortCode },
          select: ['id'],
        });

        if (!dbCheck) {
          break;
        }
      }

      if (dto.customCode) {
        this.logger.error(`Custom code: ${shortCode} already in use`);
        throw new ConflictException('Custom short code already in use');
      }

      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new ConflictException(
        'Failed to generate unique short code. Please try again.',
      );
    }

    let passwordHash!: string;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // Extract metadata for preview image
    const metadata = await this.metadataExtractorService.extractMetadata(
      dto.originalUrl,
    );

    const link = this.linkRepository.create({
      shortCode: shortCode,
      originalUrl: dto.originalUrl,
      passwordHash: passwordHash,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      title: dto.title || metadata.title,
      previewImage: metadata.image,
      createdBy: { id: userId },
    });

    const savedLink = await this.linkRepository.save(link);

    const fullUrl = `${process.env.BASE_URL}/${savedLink.shortCode}`;
    const qrCodeUrl = await this.qrCodeService.generateQrCode(
      fullUrl,
      savedLink.shortCode,
    );

    savedLink.qrCodeUrl = qrCodeUrl;
    await this.linkRepository.update(savedLink.id, { qrCodeUrl });

    await this.redisClient.sadd(this.SHORT_CODE_SET_KEY, shortCode);
    await this.cacheLink(savedLink);
    this.logger.log(`Link created: ${shortCode} for user ${userId}`);
    return { savedLink, shortUrl: fullUrl };
  }

  async getLinkByShortCode(shortCode: string): Promise<Link> {
    const cached = await this.redisClient.get(`link:${shortCode}`);
    if (cached) {
      const cachedData = JSON.parse(cached) as Link;
      return cachedData;
    }

    const link = await this.linkRepository.findOne({ where: { shortCode } });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.cacheLink(link);

    return link;
  }

  async getLinksByUser(userId: string): Promise<Link[]> {
    const links = await this.linkRepository.find({
      where: { createdBy: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return links;
  }

  async incrementClickCount(linkId: string): Promise<void> {
    // Increment in Redis first (fast)
    const counterKey = `clicks:${linkId}`;
    const count = await this.redisClient.incr(counterKey);

    // Batch update to DB every 100 clicks
    if (count % 100 === 0) {
      await this.linkRepository.update(linkId, {
        clickCount: () => `click_count + ${count}`,
        lastClickedAt: new Date(),
      });
      await this.redisClient.del(counterKey);
    }
  }

  async validateLink(link: Link): Promise<boolean> {
    if (!link.isActive) return false;
    if (link.expiresAt && new Date() > link.expiresAt) return false;
    return true;
  }

  async syncShortCodesToRedis(): Promise<void> {
    const allLinks = await this.linkRepository.find({
      select: ['shortCode'],
    });

    if (allLinks.length > 0) {
      const shortCodes = allLinks.map((link) => link.shortCode);
      await this.redisClient.sadd(this.SHORT_CODE_SET_KEY, ...shortCodes);
      console.log(`Synced ${shortCodes.length} short codes to Redis`);
    }
  }
}

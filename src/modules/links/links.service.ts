import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from 'src/entities/link.entity';
import { LoggerService } from 'src/logger/logger.service';
import { Repository } from 'typeorm';
import { CreateLinkDto } from './dto/create-link.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link)
    private linkRepository: Repository<Link>,
    private logger: LoggerService,
  ) {}

  private;

  async createLink(dto: CreateLinkDto, userId: string): Promise<Link> {
    const shortCode = dto.customCode;
    const isShortCodeExisting = await this.linkRepository.findOne({
      where: { shortCode: shortCode },
    });
    if (isShortCodeExisting) {
      this.logger.error(`Conflict: Short code ${shortCode} already exists`);
      throw new ConflictException('Short code already exists');
    }

    let passwordHash!: string;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const link = this.linkRepository.create({
      shortCode: shortCode,
      originalUrl: dto.originalUrl,
      passwordHash: passwordHash,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      title: dto.title,
      createdBy: { id: userId },
    });

    const savedLink = await this.linkRepository.save(link);

    this.logger.log(`Link created: ${shortCode} for user ${userId}`);

    return savedLink;
  }
}

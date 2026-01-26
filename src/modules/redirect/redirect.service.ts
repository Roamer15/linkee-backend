import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Queue } from 'bull';
import { LinksService } from '../links/links.service';
import { LoggerService } from 'src/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { InjectQueue } from '@nestjs/bull';

interface Context {
  ip: string | undefined;
  userAgent: string | undefined;
  referer: string | undefined;
}

@Injectable()
export class RedirectService {
  constructor(
    @InjectQueue('analytics')
    private analyticsQueue: Queue,
    private linkService: LinksService,
    private logger: LoggerService,
  ) {}

  async redirect(
    shortCode: string,
    password?: string,
    context?: Context,
  ): Promise<string> {
    // Fast path: Get link (cache-first)
    const link = await this.linkService.getLinkByShortCode(shortCode);

    // Validate link
    const isValid = await this.linkService.validateLink(link);
    if (!isValid) {
      this.logger.error('Link has expired');
      throw new NotFoundException('Link expired or inactive');
    }

    // Password check
    if (link.passwordHash) {
      if (!password) {
        throw new UnauthorizedException('Password required');
      }
      const isMatch = await bcrypt.compare(password, link.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    await this.analyticsQueue.add('track-click', {
      linkId: link.id,
      shortCode: link.shortCode,
      ip: context?.ip || '',
      userAgent: context?.userAgent,
      referer: context?.referer,
      timestamp: new Date(),
    });

    // Async: Increment counter
    await this.linkService
      .incrementClickCount(link.id)
      .catch((err) => console.error('Click count error:', err));

    return link.originalUrl;
  }
}

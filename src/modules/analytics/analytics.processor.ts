import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from 'src/entities/analytics-event.entity';
import { UAParser } from 'ua-parser-js';

interface JobData {
  linkId: string;
  ip: string;
  userAgent: string;
  referer: string;
  timestamp: Date;
}

@Processor('analytics')
export class AnalyticsProcessor {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  @Process('track-click')
  async handleClickTracking(job: Job) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jobResults: JobData = job.data;
    const { linkId, ip, userAgent, referer, timestamp } = jobResults;

    // Parse user agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceType = result.device.type || 'desktop';
    const browser = result.browser.name;
    const os = result.os.name;

    // Create analytics event
    const event = this.analyticsRepository.create({
      linkId,
      ipAddress: ip,
      userAgent,
      referer,
      deviceType,
      browser,
      os,
      clickedAt: timestamp,
    });

    await this.analyticsRepository.save(event);

    return { processed: true };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../../entities/analytics-event.entity';

export interface TimeSeriesData {
  date: string;
  clicks: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
  bot: number;
}

export interface GeoData {
  country: string;
  clicks: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  async getClicksOverTime(
    linkId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesData[]> {
    const events = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('DATE(event.clicked_at)', 'date')
      .addSelect('COUNT(*)', 'clicks')
      .where('event.link_id = :linkId', { linkId })
      .andWhere('event.clicked_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(event.clicked_at)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return events.map((e: TimeSeriesData) => ({
      date: e.date,
      clicks: parseInt(String(e.clicks)),
    }));
  }

  async getDeviceBreakdown(linkId: string): Promise<DeviceBreakdown> {
    const events = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.device_type', 'deviceType')
      .addSelect('COUNT(*)', 'count')
      .where('event.link_id = :linkId', { linkId })
      .groupBy('event.device_type')
      .getRawMany();

    const breakdown: DeviceBreakdown = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      bot: 0,
    };

    events.forEach((e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const type = e.deviceType as keyof DeviceBreakdown;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      breakdown[type] = parseInt(e.count);
    });

    return breakdown;
  }

  async getTopCountries(
    linkId: string,
    limit: number = 10,
  ): Promise<GeoData[]> {
    const events = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.country_code', 'country')
      .addSelect('COUNT(*)', 'clicks')
      .where('event.link_id = :linkId', { linkId })
      .andWhere('event.country_code IS NOT NULL')
      .groupBy('event.country_code')
      .orderBy('clicks', 'DESC')
      .limit(limit)
      .getRawMany();

    return events.map((e: GeoData) => ({
      country: e.country,
      clicks:
        typeof e.clicks === 'string' ? e.clicks : parseInt(String(e.clicks)),
    }));
  }

  async getTopReferrers(
    linkId: string,
    limit: number = 10,
  ): Promise<Array<{ referrer: string; clicks: number }>> {
    const events = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.referer', 'referrer')
      .addSelect('COUNT(*)', 'clicks')
      .where('event.link_id = :linkId', { linkId })
      .andWhere('event.referer IS NOT NULL')
      .groupBy('event.referer')
      .orderBy('clicks', 'DESC')
      .limit(limit)
      .getRawMany();

    return events.map((e) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      referrer: e.referrer,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      clicks: parseInt(e.clicks),
    }));
  }

  async getTotalClicks(linkId: string): Promise<number> {
    return await this.analyticsRepository.count({ where: { linkId } });
  }

  async getUniqueVisitors(linkId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.ip_address)', 'count')
      .where('event.link_id = :linkId', { linkId })
      .getRawOne();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return parseInt(result.count);
  }
}

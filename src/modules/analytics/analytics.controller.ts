import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get(':linkId/overview')
  async getOverview(@Param('linkId') linkId: string) {
    const [totalClicks, uniqueVisitors, deviceBreakdown, topCountries] =
      await Promise.all([
        this.analyticsService.getTotalClicks(linkId),
        this.analyticsService.getUniqueVisitors(linkId),
        this.analyticsService.getDeviceBreakdown(linkId),
        this.analyticsService.getTopCountries(linkId, 5),
      ]);

    return {
      totalClicks,
      uniqueVisitors,
      deviceBreakdown,
      topCountries,
    };
  }

  @Get(':linkId/timeseries')
  async getTimeSeries(
    @Param('linkId') linkId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return await this.analyticsService.getClicksOverTime(linkId, start, end);
  }

  @Get(':linkId/referrers')
  async getTopReferrers(@Param('linkId') linkId: string) {
    return await this.analyticsService.getTopReferrers(linkId);
  }
}

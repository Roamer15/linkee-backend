import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './analytics.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AnalyticsEvent } from 'src/entities/analytics-event.entity';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEvent]),
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

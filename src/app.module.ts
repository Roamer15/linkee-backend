import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { LinksModule } from './modules/links/links.module';
import { BullModule } from '@nestjs/bull';
import { RedirectModule } from './modules/redirect/redirect.module';
import { Link } from './entities/link.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
      username: process.env.DB_USER,
      password: `${process.env.DB_PASSWORD}`,
      database: process.env.DB_NAME,
      entities: [User, Link, AnalyticsEvent],
      synchronize: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window (60 seconds)
        limit: 100, // Max 100 requests per 60 seconds
      },
    ]),
    AuthModule,
    LoggerModule,
    LinksModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'analytics',
      adapter: BullAdapter,
    }),
    AnalyticsModule,
    RedirectModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // ✅ Apply globally
    },
    AppService,
  ],
})
export class AppModule {}

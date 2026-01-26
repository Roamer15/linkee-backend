import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'ian',
      password: '557Py2mjs8.',
      database: 'linkeedb',
      entities: [User, Link, AnalyticsEvent],
      synchronize: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    LoggerModule,
    LinksModule,
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
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
    RedirectModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

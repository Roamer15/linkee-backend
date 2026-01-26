import { Module } from '@nestjs/common';
import { RedirectService } from './redirect.service';
import { RedirectController } from './redirect.controller';
import { LoggerModule } from 'src/logger/logger.module';
import { LinksModule } from '../links/links.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'analytics' }),
    LinksModule,
    LoggerModule,
  ],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}

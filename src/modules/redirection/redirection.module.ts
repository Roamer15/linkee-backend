import { Module } from '@nestjs/common';
import { RedirectionService } from './redirection.service';
import { RedirectionController } from './redirection.controller';

@Module({
  controllers: [RedirectionController],
  providers: [RedirectionService],
})
export class RedirectionModule {}

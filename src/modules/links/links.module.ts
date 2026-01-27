import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from 'src/entities/link.entity';
import { LoggerModule } from 'src/logger/logger.module';
import { RedisModule } from 'src/common/utils/redis/redis.module';
import { QrCodeModule } from 'src/common/utils/qr/qr-code.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Link]),
    RedisModule,
    QrCodeModule,
    LoggerModule,
  ],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}

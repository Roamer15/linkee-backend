import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCodeService } from './qr-code.service';
import { QrCodeController } from './qr-code.controller';
import { Link } from 'src/entities/link.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Link])],
  controllers: [QrCodeController],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}

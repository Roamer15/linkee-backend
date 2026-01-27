import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoggerModule } from 'src/logger/logger.module';
import { User } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategy/google.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { EmailService } from 'src/common/utils/email/email.service';
import { OtpService } from './otp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ session: false }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY', // TODO: Use env variables in production
      signOptions: { expiresIn: '15m' }, // Access token expiry time
    }),
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    EmailService,
    OtpService,
  ],
  exports: [AuthService],
})
export class AuthModule {}

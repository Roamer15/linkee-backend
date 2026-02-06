import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { LoggerService } from '../../logger/logger.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { GoogleUserDto } from './dto/google.dto';
import { OtpService } from './otp.service';
import { EmailService } from 'src/common/utils/email/email.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

interface Payload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private emailService: EmailService,
    private logger: LoggerService,
  ) {}

  private generateApiKey(): string {
    return randomBytes(32).toString('hex');
  }

  private async generateToken(payload: Payload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.SUPER_SECRET_KEY || 'SUPER_SECRET_KEY',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_SECRET_KEY || 'REFRESH_SECRET_KEY',
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      hashedRefreshToken: hashedToken,
    });
  }

  async createUser(
    dto: CreateUserDto,
  ): Promise<{ message: string; email: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new ConflictException('Email already in use');
      } else {
        // User registered but never verified - resend OTP
        const otp = this.otpService.generateOtp();
        await this.otpService.storeOtp(dto.email, otp);
        await this.emailService.sendVerificationEmail(dto.email, otp, dto.name);

        return {
          message: 'Verification email resent. Please check your inbox.',
          email: dto.email,
        };
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let apiKey: string = '';
    let isUnique: boolean = false;
    while (!isUnique) {
      apiKey = this.generateApiKey();

      const existingKey = await this.userRepository.findOne({
        where: { apiKey: apiKey },
      });

      if (!existingKey) {
        isUnique = true;
      } else {
        this.logger.warn(
          `API Key collision detected for ${apiKey}. Retrying...`,
        );
      }
    }

    const newUser = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
      apiKey: apiKey,
      isEmailVerified: false, // Not verified yet
    });

    this.logger.log(`New user ${JSON.stringify(newUser)} without verification`);

    await this.userRepository.save(newUser);

    const otp = this.otpService.generateOtp();
    await this.otpService.storeOtp(dto.email, otp);
    await this.emailService.sendVerificationEmail(dto.email, otp, dto.name);

    this.logger.log(`User registered (unverified): ${dto.email}`);

    return {
      message:
        'Registration successful! Please check your email for verification code.',
      email: dto.email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name);

    const payload = { sub: user.id, email: user.email };
    const tokens = await this.generateToken(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    this.logger.log(`User verified and logged in: ${user.email}`);

    return {
      message: 'Email verified successfully',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: true,
      },
    };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const ttl = await this.otpService.getOtpTtl(email);
    if (ttl > 540) {
      throw new BadRequestException('Please wait before requesting a new code');
    }

    const otp = await this.otpService.resendOtp(email);
    await this.emailService.sendVerificationEmail(email, otp, user.name);

    this.logger.log(`OTP resent to ${email}`);

    return { message: 'Verification code resent' };
  }

  async loginUser(dto: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      this.logger.log(`Email doesn't exist`);
      throw new NotFoundException(
        `User with email ${dto.email} doesn't exist. Try another email`,
      );
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox for the verification code.',
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google Sign-In. Please log in with Google.',
      );
    }

    const passwordhash = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordhash) {
      this.logger.log('Wrong password');
      throw new UnauthorizedException('Invalid credentials. Try again');
    }

    const payload = { sub: user.id, email: user.email };

    const tokens = await this.generateToken(payload);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    await this.userRepository.update(user.id, {
      lastLogin: new Date(),
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isEmailVerified,
        plan: user.planTier || 'free',
        createdAt: user.createdAt,
      },
    };
  }

  async googleLogin(googleUser: GoogleUserDto | null) {
    if (!googleUser) {
      throw new BadRequestException('No user from Google');
    }

    // Find user by Google ID or email
    let user = await this.userRepository.findOne({
      where: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
    });

    if (!user) {
      // Create new user from Google data
      const fullName = `${googleUser.firstName} ${googleUser.lastName}`.trim();

      user = this.userRepository.create({
        email: googleUser.email,
        name: fullName,
        isEmailVerified: true,
        googleId: googleUser.googleId,
        apiKey: this.generateApiKey(),
      });

      await this.userRepository.save(user);
      this.logger.log(`New Google user created: ${user.email}`);
    } else if (!user.googleId) {
      // Link existing email account to Google
      user.googleId = googleUser.googleId;
      user.isEmailVerified = true;
      await this.userRepository.save(user);
      this.logger.log(`Linked existing account to Google: ${user.email}`);
    }

    const tokens = await this.generateToken({
      sub: user.id,
      email: user.email,
    });

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return { user, tokens };
  }

  async logoutUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { hashedRefreshToken: '' });
    this.logger.log(`Cleared refresh token for user ${userId}`);
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<Payload>(refreshToken, {
        secret: process.env.REFRESH_SECRET_KEY || 'REFRESH_SECRET_KEY',
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { sub: user.id, email: user.email };
      const tokens = await this.generateToken(newPayload);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      this.logger.log(`Tokens refreshed for user ${user.email}`);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { LoggerService } from 'src/logger/logger.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { GoogleUserDto } from './dto/google.dto';

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
    private logger: LoggerService,
  ) {}

  private generateApiKey(): string {
    return randomBytes(32).toString('hex');
  }

  private async generateToken(payload: Payload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'SUPER_SECRET_KEY',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'REFRESH_SECRET_KEY',
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

  async createUser(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      this.logger.error(`Email ${dto.email} already in use`);
      throw new ConflictException('Email already in use, try another email');
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
    });

    this.logger.log(`New user ${JSON.stringify(newUser)}`);

    return await this.userRepository.save(newUser);
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

    return tokens;
  }

  async googleLogin(googleUser: GoogleUserDto) {
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
        googleId: googleUser.googleId,
        apiKey: this.generateApiKey(),
      });

      await this.userRepository.save(user);
      this.logger.log(`New Google user created: ${user.email}`);
    } else if (!user.googleId) {
      // Link existing email account to Google
      user.googleId = googleUser.googleId;
      await this.userRepository.save(user);
      this.logger.log(`Linked existing account to Google: ${user.email}`);
    }

    const tokens = await this.generateToken({
      sub: user.id,
      email: user.email,
    });

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }
}

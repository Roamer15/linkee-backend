import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

/**
 * Interface representing the decoded JWT payload structure.
 * Follows the naming conventions in CODE_STANDARDS.md.
 */
interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      // Extracts the token from the Authorization header as a Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPER_SECRET_KEY || 'SUPER_SECRET_KEY',
    });
  }

  /**
   * Validates the payload and returns the user.
   * Uses explicit return types as per TypeScript Guidelines.
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }

    return user;
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY = 600;

  constructor(
    @Inject('REDIS_CLIENT')
    private redisClient: Redis,
  ) {}

  generateOtp(): string {
    // Generate 6-digit OTP
    return randomInt(100000, 999999).toString();
  }

  async storeOtp(email: string, otp: string): Promise<void> {
    const key = `otp:${email}`;
    await this.redisClient.setex(key, this.OTP_EXPIRY, otp);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const key = `otp:${email}`;
    const storedOtp = await this.redisClient.get(key);

    if (!storedOtp || storedOtp !== otp) {
      return false;
    }

    await this.redisClient.del(key);
    return true;
  }

  async resendOtp(email: string): Promise<string> {
    const newOtp = this.generateOtp();
    await this.storeOtp(email, newOtp);
    return newOtp;
  }

  async getOtpTtl(email: string): Promise<number> {
    const key = `otp:${email}`;
    return await this.redisClient.ttl(key);
  }
}

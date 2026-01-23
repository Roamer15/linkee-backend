import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig } from '../../config/redis.config';

@Global() // Makes it available everywhere without re-importing
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const config = redisConfig();
        const client = new Redis(config);

        client.on('error', (err) => {
          console.error('Redis Client Error', err);
        });

        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}

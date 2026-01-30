import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LinksService } from './modules/links/links.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const linksService = app.get(LinksService);
  await linksService.syncShortCodesToRedis();

  app.enableCors({
    origin: [
      'https://linkee.app',
      'https://www.linkee.app',
      'http://localhost:3001', // Development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

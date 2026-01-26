import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LinksService } from './modules/links/links.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const linksService = app.get(LinksService);
  await linksService.syncShortCodesToRedis();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

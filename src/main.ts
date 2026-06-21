import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [
      'debug',
      'log',
      'error',
      'error',
      'warn',
      'fatal',
    ],
  });
  await app.listen(process.env.PORT ?? 9090);
}
bootstrap();

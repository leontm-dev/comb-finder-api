import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import compression from 'compression';

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
    cors: {
      origin: '*',
      methods: ['GET', 'PATCH'],
    },
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const testVar = configService.get('DATABASE_URL');
  logger.log(`Test Environment Variable: ${testVar}`);
  app.use(compression());
  const documentConfig = new DocumentBuilder()
    .setTitle('comp-finder API')
    .setDescription(
      'Find comps with filters or simply by currently trending comps.',
    )
    .setVersion('0.1.0')
    .setContact(
      'LeonTM',
      'https://leontm.me',
      'lanneken09@gmail.com',
    )
    .setTermsOfService(
      'https://github.com/leontm-dev/comp-finder',
    )
    .addSecurity('basic-rate-limits', {
      description:
        'Rate limits are automatically applied to not run into performance issues.',
      type: 'http',
    })
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup(
    '/docs-swagger',
    app,
    documentFactory,
  );
  app.use(
    '/docs',
    apiReference({
      content: documentFactory,
      layout: 'modern',
      theme: 'fastify',
      title: 'comp-finder API',
      showSidebar: true,
      _integration: 'nestjs',
      persistAuth: false,
      documentDownloadType: 'json',
      darkMode: true,
      metaData: {
        title: 'comp-finder API',
        description:
          'An api to programmatically use the comp-finder service',
      },
      hideDownloadButton: false,
      withDefaultFonts: true,
      defaultOpenAllTags: false,
      slug: 'comp-finder-api',
    }),
  );
  await app.listen(process.env.PORT ?? 9090);
}
bootstrap();

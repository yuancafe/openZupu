import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    const originList = corsOrigins.split(',').map((o) => o.trim());
    app.enableCors({
      origin: originList,
      credentials: true,
    });
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: CORS_ORIGINS environment variable is required but not set in production!',
      );
    }
    console.warn(
      'WARNING: CORS_ORIGINS is not defined, allowing mirrored origins in development mode',
    );
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('OpenZupu API')
    .setDescription('The OpenZupu API description (v1.0)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}
bootstrap();

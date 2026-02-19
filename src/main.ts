import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mini CRM API')
    .setDescription('Production-grade Mini CRM API with lead management')
    .setVersion('1.0.0')
    .addTag('Health', 'Health check endpoints')
    .addTag('Leads', 'Lead management and CRUD operations')
    .addTag('Dashboard', 'Analytics and statistics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Serve raw OpenAPI JSON
  app.getHttpAdapter().get('/docs-json', (req, res) => {
    res.json(document);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Mini CRM API is running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

bootstrap();

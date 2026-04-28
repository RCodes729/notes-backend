import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin === 'http://localhost:3000' || origin === 'http://localhost:3001')
        return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // IMPORTANT: ensure OPTIONS preflight is answered for every route
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  instance.options('*', (_req: any, res: any) => res.sendStatus(204));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
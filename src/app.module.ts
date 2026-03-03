import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { HealthModule } from './modules/health/health.module';
import { LeadsModule } from './modules/leads/leads.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;

        return {
          ttl: 30_000,
          stores: redisUrl ? [createKeyv(redisUrl)] : undefined,
        };
      },
    }),
    HealthModule,
    LeadsModule,
    DashboardModule,
  ],
})
export class AppModule {}

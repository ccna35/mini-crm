import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { LeadsModule } from './modules/leads/leads.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [HealthModule, LeadsModule, DashboardModule],
})
export class AppModule {}

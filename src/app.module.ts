import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { LeadsModule } from './modules/leads/leads.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [HealthModule, LeadsModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

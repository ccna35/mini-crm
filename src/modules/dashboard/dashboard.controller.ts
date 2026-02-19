import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { DashboardService, DashboardStats } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @ApiOperation({
        summary: 'Get dashboard statistics',
        description:
            'Get comprehensive statistics about leads including counts by status, win rate, and followup information',
    })
    @ApiOkResponse({
        description: 'Dashboard statistics',
        type: Object,
        schema: {
            example: {
                totalLeads: 30,
                leadsByStatus: {
                    NEW: 5,
                    CONTACTED: 10,
                    PROPOSAL: 8,
                    ON_HOLD: 3,
                    WON: 3,
                    LOST: 1,
                },
                overdueFollowups: 2,
                upcomingFollowups: 5,
                winRate: 10,
                averageTimeToWin: 5,
            },
        },
    })
    async getStats(): Promise<DashboardStats> {
        return this.dashboardService.getStats();
    }
}

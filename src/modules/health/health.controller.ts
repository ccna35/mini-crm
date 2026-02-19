import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

interface HealthResponse {
    status: string;
    timestamp: string;
    uptime: number;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({
        summary: 'Health check',
        description: 'Check if the API is running and healthy',
    })
    @ApiOkResponse({
        description: 'API is healthy',
        schema: {
            example: {
                status: 'healthy',
                timestamp: '2024-02-19T10:00:00Z',
                uptime: 12345,
            },
        },
    })
    health(): HealthResponse {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
}

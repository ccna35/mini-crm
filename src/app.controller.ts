import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({
    summary: 'Get API information',
    description: 'Returns basic information about the Mini CRM API',
  })
  @ApiOkResponse({
    description: 'API information',
    schema: {
      example: {
        name: 'Mini CRM API',
        version: '1.0.0',
        description: 'Production-grade Lead Management API',
        environment: 'development',
        docsUrl: '/docs',
      },
    },
  })
  getInfo() {
    return this.appService.getInfo();
  }
}

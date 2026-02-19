import { Injectable } from '@nestjs/common';

interface AppInfo {
  name: string;
  version: string;
  description: string;
  environment: string;
  docsUrl: string;
}

@Injectable()
export class AppService {
  getInfo(): AppInfo {
    return {
      name: 'Mini CRM API',
      version: '1.0.0',
      description: 'Production-grade Lead Management API',
      environment: process.env.NODE_ENV || 'development',
      docsUrl: '/docs',
    };
  }
}

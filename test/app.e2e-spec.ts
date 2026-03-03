import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { LeadStatus } from '@prisma/client';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Mini CRM API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global setup
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clear database before tests
    await prisma.lead.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('GET /api/health - should return 200', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('status', 'healthy');
          expect(res.body.data).toHaveProperty('timestamp');
          expect(res.body.data).toHaveProperty('uptime');
        });
    });
  });

  describe('Leads - POST /api/leads', () => {
    it('should create a new lead', () => {
      return request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-1234',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe('John Doe');
          expect(res.body.data.email).toBe('john@example.com');
          expect(res.body.data.status).toBe(LeadStatus.NEW);
        });
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'Jane Smith',
          email: 'jane@example.com',
        })
        .expect(400);
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'Invalid',
          email: 'not-an-email',
        })
        .expect(400);
    });

    it('should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'John',
        })
        .expect(400);
    });
  });

  describe('Leads - GET /api/leads', () => {
    beforeEach(async () => {
      // Clear and create test data
      await prisma.lead.deleteMany({});

      await prisma.lead.createMany({
        data: [
          {
            name: 'Lead 1',
            email: 'lead1@example.com',
            status: LeadStatus.NEW,
          },
          {
            name: 'Lead 2',
            email: 'lead2@example.com',
            status: LeadStatus.CONTACTED,
          },
          {
            name: 'Lead 3',
            email: 'lead3@example.com',
            status: LeadStatus.PROPOSAL,
          },
        ],
      });
    });

    it('should list all leads', () => {
      return request(app.getHttpServer())
        .get('/api/leads')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data.data)).toBe(true);
          expect(res.body.data.total).toBe(3);
          expect(res.body.data.page).toBe(1);
          expect(res.body.data.limit).toBe(10);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/leads?page=2&limit=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.page).toBe(2);
          expect(res.body.data.limit).toBe(1);
          expect(res.body.data.data.length).toBe(1);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/leads?status=CONTACTED')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.total).toBe(1);
          expect(res.body.data.data[0].status).toBe(LeadStatus.CONTACTED);
        });
    });

    it('should search by name', () => {
      return request(app.getHttpServer())
        .get('/api/leads?search=Lead%201')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.total).toBe(1);
          expect(res.body.data.data[0].name).toBe('Lead 1');
        });
    });
  });

  describe('Leads - GET /api/leads/:id', () => {
    let leadId: string;

    beforeEach(async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Test Lead',
          email: 'test@example.com',
        },
      });
      leadId = lead.id;
    });

    it('should get a lead by id', () => {
      return request(app.getHttpServer())
        .get(`/api/leads/${leadId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(leadId);
          expect(res.body.data.name).toBe('Test Lead');
        });
    });

    it('should return 404 for non-existent lead', () => {
      return request(app.getHttpServer()).get('/api/leads/nonexistent').expect(404);
    });
  });

  describe('Leads - PATCH /api/leads/:id', () => {
    let leadId: string;

    beforeEach(async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Test Lead',
          email: 'test@example.com',
        },
      });
      leadId = lead.id;
    });

    it('should update a lead', () => {
      return request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .send({
          status: LeadStatus.CONTACTED,
          phone: '+1-555-9999',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe(LeadStatus.CONTACTED);
          expect(res.body.data.phone).toBe('+1-555-9999');
        });
    });

    it('should require lostReason when status is LOST', () => {
      return request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .send({
          status: LeadStatus.LOST,
        })
        .expect(400);
    });

    it('should accept LOST status with lostReason', () => {
      return request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .send({
          status: LeadStatus.LOST,
          lostReason: 'Budget constraints',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe(LeadStatus.LOST);
          expect(res.body.data.lostReason).toBe('Budget constraints');
        });
    });

    it('should auto-set nextFollowUpAt to +2 days for PROPOSAL', () => {
      return request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .send({
          status: LeadStatus.PROPOSAL,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe(LeadStatus.PROPOSAL);
          expect(res.body.data.nextFollowUpAt).toBeTruthy();
        });
    });

    it('should clear nextFollowUpAt when status is WON', () => {
      return request(app.getHttpServer())
        .patch(`/api/leads/${leadId}`)
        .send({
          status: LeadStatus.WON,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe(LeadStatus.WON);
          expect(res.body.data.nextFollowUpAt).toBeNull();
        });
    });
  });

  describe('Leads - DELETE /api/leads/:id', () => {
    let leadId: string;

    beforeEach(async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Test Lead',
          email: 'test@example.com',
        },
      });
      leadId = lead.id;
    });

    it('should delete a lead', () => {
      return request(app.getHttpServer())
        .delete(`/api/leads/${leadId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(leadId);
        });
    });

    it('should return 404 when deleting non-existent lead', () => {
      return request(app.getHttpServer()).delete('/api/leads/nonexistent').expect(404);
    });
  });

  describe('Leads - Overdue and Upcoming', () => {
    beforeEach(async () => {
      await prisma.lead.deleteMany({});

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await prisma.lead.createMany({
        data: [
          {
            name: 'Overdue Lead',
            email: 'overdue@example.com',
            status: LeadStatus.CONTACTED,
            nextFollowUpAt: yesterday,
          },
          {
            name: 'Upcoming Lead',
            email: 'upcoming@example.com',
            status: LeadStatus.PROPOSAL,
            nextFollowUpAt: tomorrow,
          },
        ],
      });
    });

    it('should get overdue followups', () => {
      return request(app.getHttpServer())
        .get('/api/leads/overdue')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should get upcoming followups', () => {
      return request(app.getHttpServer())
        .get('/api/leads/upcoming')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Dashboard - GET /api/dashboard/stats', () => {
    beforeEach(async () => {
      await prisma.lead.deleteMany({});

      await prisma.lead.createMany({
        data: [
          { name: 'Lead 1', email: 'lead1@example.com', status: LeadStatus.NEW },
          { name: 'Lead 2', email: 'lead2@example.com', status: LeadStatus.CONTACTED },
          { name: 'Lead 3', email: 'lead3@example.com', status: LeadStatus.WON },
        ],
      });
    });

    it('should return dashboard statistics', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .expect(200)
        .expect((res) => {
          const stats = res.body.data;
          expect(stats).toHaveProperty('totalLeads');
          expect(stats).toHaveProperty('leadsByStatus');
          expect(stats).toHaveProperty('overdueFollowups');
          expect(stats).toHaveProperty('upcomingFollowups');
          expect(stats).toHaveProperty('winRate');
          expect(stats.totalLeads).toBe(3);
          expect(stats.leadsByStatus[LeadStatus.NEW]).toBe(1);
        });
    });
  });
});

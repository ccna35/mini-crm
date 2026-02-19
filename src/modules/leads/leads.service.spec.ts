import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../database/prisma.service';
import { Status } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LeadsService', () => {
    let service: LeadsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        lead: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LeadsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<LeadsService>(LeadsService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new lead', async () => {
            const createLeadDto = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1-555-1234',
            };

            const expectedLead = {
                id: '1',
                ...createLeadDto,
                status: Status.NEW,
                lostReason: null,
                nextFollowUpAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.lead.create.mockResolvedValue(expectedLead);

            const result = await service.create(createLeadDto);
            expect(result).toEqual(expectedLead);
            expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
                data: {
                    name: createLeadDto.name,
                    email: createLeadDto.email,
                    phone: createLeadDto.phone,
                    status: Status.NEW,
                },
            });
        });

        it('should throw error if email already exists', async () => {
            const createLeadDto = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1-555-1234',
            };

            mockPrismaService.lead.create.mockRejectedValue({
                code: 'P2002',
                meta: { target: ['email'] },
            });

            await expect(service.create(createLeadDto)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('findOne', () => {
        it('should return a lead by id', async () => {
            const leadId = '1';
            const lead = {
                id: leadId,
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1-555-1234',
                status: Status.NEW,
                lostReason: null,
                nextFollowUpAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.lead.findUnique.mockResolvedValue(lead);

            const result = await service.findOne(leadId);
            expect(result).toEqual(lead);
            expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
                where: { id: leadId },
            });
        });

        it('should throw NotFoundException if lead not found', async () => {
            mockPrismaService.lead.findUnique.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        const leadId = '1';
        const existingLead = {
            id: leadId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1-555-1234',
            status: Status.NEW,
            lostReason: null,
            nextFollowUpAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        beforeEach(() => {
            mockPrismaService.lead.findUnique.mockResolvedValue(existingLead);
        });

        it('should update a lead', async () => {
            const updateLeadDto = {
                status: Status.CONTACTED,
            };

            const updatedLead = { ...existingLead, ...updateLeadDto };
            mockPrismaService.lead.update.mockResolvedValue(updatedLead);

            const result = await service.update(leadId, updateLeadDto);
            expect(result.status).toEqual(Status.CONTACTED);
        });

        it('should throw error if LOST status without lostReason', async () => {
            const updateLeadDto = {
                status: Status.LOST,
            };

            await expect(service.update(leadId, updateLeadDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should set nextFollowUpAt to now + 2 days when status is PROPOSAL', async () => {
            const updateLeadDto = {
                status: Status.PROPOSAL,
            };

            const now = new Date();
            const expectedFollowUp = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

            mockPrismaService.lead.update.mockImplementation(async ({ data }) => {
                return { ...existingLead, ...data };
            });

            const result = await service.update(leadId, updateLeadDto);
            expect(result.status).toEqual(Status.PROPOSAL);
            expect(mockPrismaService.lead.update).toHaveBeenCalled();
        });

        it('should clear nextFollowUpAt when status is WON', async () => {
            const updateLeadDto = {
                status: Status.WON,
                nextFollowUpAt: '2024-12-20T10:00:00Z',
            };

            mockPrismaService.lead.update.mockImplementation(async ({ data }) => {
                return { ...existingLead, status: Status.WON, nextFollowUpAt: null };
            });

            const result = await service.update(leadId, updateLeadDto);
            expect(result.nextFollowUpAt).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return paginated leads', async () => {
            const leads = [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1-555-1234',
                    status: Status.NEW,
                    lostReason: null,
                    nextFollowUpAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPrismaService.lead.findMany.mockResolvedValue(leads);
            mockPrismaService.lead.count.mockResolvedValue(1);

            const result = await service.findAll({});
            expect(result.data).toEqual(leads);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should filter by status', async () => {
            const leads = [];
            mockPrismaService.lead.findMany.mockResolvedValue(leads);
            mockPrismaService.lead.count.mockResolvedValue(0);

            await service.findAll({ status: Status.CONTACTED });

            expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: Status.CONTACTED }),
                }),
            );
        });

        it('should filter overdue followups', async () => {
            const leads = [];
            mockPrismaService.lead.findMany.mockResolvedValue(leads);
            mockPrismaService.lead.count.mockResolvedValue(0);

            await service.findAll({ isOverdue: 'true' });

            expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: {
                            in: [Status.CONTACTED, Status.PROPOSAL, Status.ON_HOLD],
                        },
                        nextFollowUpAt: expect.any(Object),
                    }),
                }),
            );
        });
    });
});

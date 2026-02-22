import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LeadStatus, Lead } from '@prisma/client';
import { CreateLeadDto, UpdateLeadDto, ListLeadsQueryDto } from './dtos/lead.dto';

export interface ListLeadsResult {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    try {
      const data: any = {
        name: createLeadDto.name,
        phone: createLeadDto.phone,
        status: LeadStatus.NEW,
      };

      if (createLeadDto.email !== undefined) {
        data.email = createLeadDto.email;
      }

      return await this.prisma.lead.create({
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(query: ListLeadsQueryDto): Promise<ListLeadsResult> {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Filter by search (name or email)
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter overdue followups
    if (query.isOverdue === 'true') {
      where.status = {
        in: [LeadStatus.CONTACTED, LeadStatus.PROPOSAL, LeadStatus.ON_HOLD],
      };
      where.nextFollowUpAt = {
        lt: new Date(),
      };
    }

    // Determine sort
    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) {
      const validSortFields = ['createdAt', 'updatedAt', 'status', 'nextFollowUpAt', 'name'];
      if (validSortFields.includes(query.sortBy)) {
        const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
        orderBy = { [query.sortBy]: order };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with id ${id} not found`);
    }

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    // Verify lead exists
    await this.findOne(id);

    // Business rule: If status becomes LOST, lostReason is required
    if (updateLeadDto.status === LeadStatus.LOST && !updateLeadDto.lostReason) {
      throw new BadRequestException('lostReason is required when status is LOST');
    }

    // Business rule: If status becomes PROPOSAL and nextFollowUpAt is null, set it to now + 2 days
    let nextFollowUpAt: string | null | undefined = updateLeadDto.nextFollowUpAt;
    if (updateLeadDto.status === LeadStatus.PROPOSAL && !nextFollowUpAt) {
      const now = new Date();
      nextFollowUpAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Business rule: If status becomes WON, clear nextFollowUpAt
    if (updateLeadDto.status === LeadStatus.WON) {
      nextFollowUpAt = null;
    }

    try {
      return await this.prisma.lead.update({
        where: { id },
        data: {
          name: updateLeadDto.name,
          phone: updateLeadDto.phone,
          status: updateLeadDto.status,
          lostReason: updateLeadDto.lostReason,
          nextFollowUpAt:
            nextFollowUpAt !== undefined
              ? nextFollowUpAt
                ? new Date(nextFollowUpAt)
                : null
              : undefined,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Lead> {
    // Verify lead exists
    await this.findOne(id);

    return await this.prisma.lead.delete({
      where: { id },
    });
  }

  async getOverdueFollowups(): Promise<Lead[]> {
    return await this.prisma.lead.findMany({
      where: {
        status: {
          in: [LeadStatus.CONTACTED, LeadStatus.PROPOSAL, LeadStatus.ON_HOLD],
        },
        nextFollowUpAt: {
          lt: new Date(),
        },
      },
      orderBy: {
        nextFollowUpAt: 'asc',
      },
    });
  }

  async getUpcomingFollowups(days: number = 7): Promise<Lead[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return await this.prisma.lead.findMany({
      where: {
        status: {
          in: [LeadStatus.CONTACTED, LeadStatus.PROPOSAL, LeadStatus.ON_HOLD],
        },
        nextFollowUpAt: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: {
        nextFollowUpAt: 'asc',
      },
    });
  }
}

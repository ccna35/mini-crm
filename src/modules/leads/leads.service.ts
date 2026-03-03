import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
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
  private static readonly LEADS_LIST_CACHE_TTL_MS = 30_000;
  private static readonly LEADS_LIST_VERSION_KEY = 'leads:list:version';

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    try {
      const data: CreateLeadDto = {
        ...createLeadDto,
      };

      if (createLeadDto.email !== undefined) {
        data.email = createLeadDto.email;
      }

      const createdLead = await this.prisma.lead.create({
        data,
      });

      await this.bumpLeadsListCacheVersion();

      return createdLead;
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

    const version = await this.getLeadsListCacheVersion();
    const cacheKey = this.buildLeadsListCacheKey(version, query, page, limit);
    const cachedData = await this.cacheManager.get<ListLeadsResult>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const where: any = {};

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Filter by source
    if (query.source) {
      where.source = { contains: query.source, mode: 'insensitive' };
    }

    // Filter by search (name or email)
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { source: { contains: query.search, mode: 'insensitive' } },
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

    const result = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, LeadsService.LEADS_LIST_CACHE_TTL_MS);

    return result;
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
      const updatedLead = await this.prisma.lead.update({
        where: { id },
        data: {
          name: updateLeadDto.name,
          phone: updateLeadDto.phone,
          status: updateLeadDto.status,
          source: updateLeadDto.source,
          company: updateLeadDto.company,
          email: updateLeadDto.email,
          notes: updateLeadDto.notes,
          value: updateLeadDto.value,
          lostReason: updateLeadDto.lostReason,
          nextFollowUpAt:
            nextFollowUpAt !== undefined
              ? nextFollowUpAt
                ? new Date(nextFollowUpAt)
                : null
              : undefined,
        },
      });

      await this.bumpLeadsListCacheVersion();

      return updatedLead;
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

    const deletedLead = await this.prisma.lead.delete({
      where: { id },
    });

    await this.bumpLeadsListCacheVersion();

    return deletedLead;
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

  async getSources(): Promise<{ source: string; count: number }[]> {
    const result = await this.prisma.lead.groupBy({
      by: ['source'],
      _count: {
        source: true,
      },
    });

    return result.map((item) => ({
      source: item.source || 'Unknown',
      count: item._count.source,
    }));
  }

  private async getLeadsListCacheVersion(): Promise<number> {
    const cacheVersion = await this.cacheManager.get<number | string>(
      LeadsService.LEADS_LIST_VERSION_KEY,
    );

    if (cacheVersion === undefined || cacheVersion === null) {
      const initialVersion = 1;
      await this.cacheManager.set(LeadsService.LEADS_LIST_VERSION_KEY, initialVersion);
      return initialVersion;
    }

    const numericVersion =
      typeof cacheVersion === 'number' ? cacheVersion : Number.parseInt(cacheVersion, 10);

    if (Number.isNaN(numericVersion) || numericVersion <= 0) {
      const initialVersion = 1;
      await this.cacheManager.set(LeadsService.LEADS_LIST_VERSION_KEY, initialVersion);
      return initialVersion;
    }

    return numericVersion;
  }

  private buildLeadsListCacheKey(
    version: number,
    query: ListLeadsQueryDto,
    page: number,
    limit: number,
  ): string {
    const normalizedQuery = {
      page,
      limit,
      status: query.status ?? null,
      search: query.search ?? null,
      source: query.source ?? null,
      isOverdue: query.isOverdue ?? null,
      sortBy: query.sortBy ?? null,
      sortOrder: query.sortOrder ?? null,
    };

    return `leads:list:v${version}:${JSON.stringify(normalizedQuery)}`;
  }

  private async bumpLeadsListCacheVersion(): Promise<void> {
    const currentVersion = await this.getLeadsListCacheVersion();
    await this.cacheManager.set(LeadsService.LEADS_LIST_VERSION_KEY, currentVersion + 1);
  }
}

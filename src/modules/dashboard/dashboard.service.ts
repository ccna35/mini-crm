import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LeadStatus } from '@prisma/client';

export interface DashboardStats {
  totalLeads: number;
  leadsByStatus: Record<LeadStatus, number>;
  overdueFollowups: number;
  upcomingFollowups: number;
  winRate: number;
  averageTimeToWin: number | null;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const totalLeads = await this.prisma.lead.count();

    // Count by status
    const statusCounts = await Promise.all(
      Object.values(LeadStatus).map(async (status) => ({
        status,
        count: await this.prisma.lead.count({ where: { status } }),
      })),
    );

    const leadsByStatus = statusCounts.reduce(
      (acc, { status, count }) => {
        acc[status] = count;
        return acc;
      },
      {} as Record<LeadStatus, number>,
    );

    // Overdue followups
    const overdueFollowups = await this.prisma.lead.count({
      where: {
        status: {
          in: [LeadStatus.CONTACTED, LeadStatus.PROPOSAL, LeadStatus.ON_HOLD],
        },
        nextFollowUpAt: {
          lt: new Date(),
        },
      },
    });

    // Upcoming followups (next 7 days)
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingFollowups = await this.prisma.lead.count({
      where: {
        status: {
          in: [LeadStatus.CONTACTED, LeadStatus.PROPOSAL, LeadStatus.ON_HOLD],
        },
        nextFollowUpAt: {
          gte: now,
          lte: futureDate,
        },
      },
    });

    // Win rate
    const winRate = totalLeads > 0 ? (leadsByStatus[LeadStatus.WON] / totalLeads) * 100 : 0;

    // Average time to win (from creation to WON)
    const wonLeads = await this.prisma.lead.findMany({
      where: { status: LeadStatus.WON },
      select: { createdAt: true, updatedAt: true },
    });

    let averageTimeToWin: number | null = null;
    if (wonLeads.length > 0) {
      const totalTime = wonLeads.reduce((sum, lead) => {
        const timeDiff = lead.updatedAt.getTime() - lead.createdAt.getTime();
        return sum + timeDiff;
      }, 0);
      averageTimeToWin = Math.round(totalTime / wonLeads.length / (1000 * 60 * 60 * 24)); // in days
    }

    return {
      totalLeads,
      leadsByStatus,
      overdueFollowups,
      upcomingFollowups,
      winRate: Math.round(winRate * 100) / 100,
      averageTimeToWin,
    };
  }
}

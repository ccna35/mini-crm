import { PrismaClient, LeadStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Simple seeded random generator for deterministic results
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

const rng = new SeededRandom(12345); // Fixed seed for reproducibility

const egyptianFirstNames = [
  'محمد',
  'أحمد',
  'علي',
  'حسن',
  'إبراهيم',
  'فاطمة',
  'عائشة',
  'منى',
  'ليلى',
  'نور',
  'زيد',
  'عمر',
  'سارة',
  'هناء',
  'رقية',
];

const egyptianLastNames = [
  'محمود',
  'حسن',
  'إبراهيم',
  'علي',
  'أحمد',
  'خليل',
  'جمال',
  'ناصر',
  'سالم',
  'نجيب',
];

// Fake but realistic Egyptian phone numbers (clearly fake format)
const phonePatterns = [
  (n: number) => `+201001234${String(n).padStart(3, '0')}`,
  (n: number) => `+201001244${String(n).padStart(3, '0')}`,
  (n: number) => `+201551123${String(n).padStart(3, '0')}`,
  (n: number) => `+201274899${String(n).padStart(3, '0')}`,
];

const sources = ['Facebook', 'WhatsApp', 'Referral', 'LinkedIn', 'Google', 'Direct Call', 'Email'];

const companies = [
  'Tech Innovations Co.',
  'Digital Solutions Ltd.',
  'E-commerce Hub',
  'Marketing Pro',
  'Cloud Services Inc.',
  'Data Analytics Corp.',
  'Web Design Studio',
  'Mobile Apps Dev',
];

const generateLeads = (): Array<{
  name: string;
  phone: string;
  email: string;
  company: string;
  status: LeadStatus;
  source: string;
  value: number | null;
  nextFollowUpAt: Date | null;
  notes: string | null;
  lostReason: string | null;
  createdAt: Date;
}> => {
  const leads: Array<{
    name: string;
    phone: string;
    email: string;
    company: string;
    status: LeadStatus;
    source: string;
    value: number | null;
    nextFollowUpAt: Date | null;
    notes: string | null;
    lostReason: string | null;
    createdAt: Date;
  }> = [];
  let leadNumber = 1;

  const createLead = (
    status: LeadStatus,
    isOverdue: boolean = false,
  ): {
    name: string;
    phone: string;
    email: string;
    company: string;
    status: LeadStatus;
    source: string;
    value: number | null;
    nextFollowUpAt: Date | null;
    notes: string | null;
    lostReason: string | null;
    createdAt: Date;
  } => {
    const firstName = rng.choice(egyptianFirstNames);
    const lastName = rng.choice(egyptianLastNames);
    const phonePattern = rng.choice(phonePatterns);
    const shouldHaveValue = rng.next() > 0.3; // 70% have a value
    const shouldHaveNotes = rng.next() > 0.4;

    let nextFollowUpAt: Date | null = null;
    const needsFollowUp: LeadStatus[] = [
      LeadStatus.CONTACTED,
      LeadStatus.PROPOSAL,
      LeadStatus.ON_HOLD,
    ];
    if (needsFollowUp.includes(status)) {
      if (isOverdue) {
        // 2-7 days ago
        nextFollowUpAt = new Date();
        nextFollowUpAt.setDate(nextFollowUpAt.getDate() - rng.range(2, 7));
      } else {
        // 3-15 days from now
        nextFollowUpAt = new Date();
        nextFollowUpAt.setDate(nextFollowUpAt.getDate() + rng.range(3, 15));
      }
    }

    return {
      name: `${firstName} ${lastName}`,
      phone: phonePattern(leadNumber),
      email: `lead${leadNumber}@example.com`,
      company: rng.choice(companies),
      status,
      source: rng.choice(sources),
      value: shouldHaveValue ? parseFloat((rng.range(500, 50000) / 100).toFixed(2)) : null,
      nextFollowUpAt,
      notes: shouldHaveNotes ? `Follow-up notes for lead ${leadNumber}` : null,
      lostReason:
        status === LeadStatus.LOST
          ? rng.choice(['Budget constraints', 'Chose competitor', 'No response', 'Not a good fit'])
          : null,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    };
  };

  // 8 NEW
  for (let i = 0; i < 8; i++) {
    leads.push(createLead(LeadStatus.NEW, false));
    leadNumber++;
  }

  // 8 CONTACTED (2 overdue)
  for (let i = 0; i < 8; i++) {
    leads.push(createLead(LeadStatus.CONTACTED, i < 2));
    leadNumber++;
  }

  // 6 PROPOSAL (2 overdue)
  for (let i = 0; i < 6; i++) {
    leads.push(createLead(LeadStatus.PROPOSAL, i < 2));
    leadNumber++;
  }

  // 4 ON_HOLD (2 overdue)
  for (let i = 0; i < 4; i++) {
    leads.push(createLead(LeadStatus.ON_HOLD, i < 2));
    leadNumber++;
  }

  // 2 WON
  for (let i = 0; i < 2; i++) {
    leads.push(createLead(LeadStatus.WON, false));
    leadNumber++;
  }

  // 2 LOST
  for (let i = 0; i < 2; i++) {
    leads.push(createLead(LeadStatus.LOST, false));
    leadNumber++;
  }

  return leads;
};

const main = async () => {
  console.log('🌱 Starting seed...');

  try {
    // Delete existing leads
    await prisma.lead.deleteMany({});
    console.log('✓ Cleared existing leads');

    // Generate and create seed data
    const leads = generateLeads();

    const result = await prisma.lead.createMany({
      data: leads,
    });

    console.log(`✓ Created ${result.count} leads`);

    // Summary
    const stats = await prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    });

    console.log('\n📊 Lead Status Distribution:');
    stats.forEach((stat) => {
      console.log(`  ${stat.status}: ${stat._count}`);
    });

    const overdueCount = await prisma.lead.count({
      where: {
        nextFollowUpAt: {
          lt: new Date(),
        },
        status: {
          in: [LeadStatus.CONTACTED, LeadStatus.PROPOSAL, LeadStatus.ON_HOLD],
        },
      },
    });

    console.log(`\n⏰ Overdue Followups: ${overdueCount}`);
    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();

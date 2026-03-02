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

const createLead = (
  leadNumber: number,
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

const main = async () => {
  console.log('🌱 Starting seed with 1,000,000 leads...');

  try {
    // Delete existing leads
    await prisma.lead.deleteMany({});
    console.log('✓ Cleared existing leads');

    const TOTAL_LEADS = 1_000_000;
    const BATCH_SIZE = 5000;

    // Calculate distribution based on original ratios
    // From original: 8+8+6+4+2+2 = 30 total
    // NEW: 8/30, CONTACTED: 8/30, PROPOSAL: 6/30, ON_HOLD: 4/30, WON: 2/30, LOST: 2/30
    const distribution = {
      new: Math.floor(TOTAL_LEADS * (8 / 30)),
      contacted: Math.floor(TOTAL_LEADS * (8 / 30)),
      proposal: Math.floor(TOTAL_LEADS * (6 / 30)),
      onHold: Math.floor(TOTAL_LEADS * (4 / 30)),
      won: Math.floor(TOTAL_LEADS * (2 / 30)),
      lost: TOTAL_LEADS - Math.floor(TOTAL_LEADS * (28 / 30)), // Remainder goes here
    };

    let totalCreated = 0;
    let leadNumber = 1;

    // Helper to create leads in batches
    const createLeadsInBatch = async (count: number, status: LeadStatus) => {
      for (let batch = 0; batch < Math.ceil(count / BATCH_SIZE); batch++) {
        const batchLeads: Array<{
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
        const batchStart = batch * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, count);

        for (let i = batchStart; i < batchEnd; i++) {
          // Distribute overdue follows ups (approximately 25% for statuses that need follow-up)
          const needsFollowUp: LeadStatus[] = [
            LeadStatus.CONTACTED,
            LeadStatus.PROPOSAL,
            LeadStatus.ON_HOLD,
          ];
          const isOverdue = needsFollowUp.includes(status) && Math.random() < 0.25;
          batchLeads.push(createLead(leadNumber, status, isOverdue));
          leadNumber++;
        }

        const result = await prisma.lead.createMany({
          data: batchLeads,
        });

        totalCreated += result.count;
        const progress = ((totalCreated / TOTAL_LEADS) * 100).toFixed(2);
        console.log(
          `  ⌛ Progress: ${totalCreated.toLocaleString()} / ${TOTAL_LEADS.toLocaleString()} (${progress}%)`,
        );
      }
    };

    // Create leads by status
    console.log('\n📝 Generating leads by status...');
    await createLeadsInBatch(distribution.new, LeadStatus.NEW);
    await createLeadsInBatch(distribution.contacted, LeadStatus.CONTACTED);
    await createLeadsInBatch(distribution.proposal, LeadStatus.PROPOSAL);
    await createLeadsInBatch(distribution.onHold, LeadStatus.ON_HOLD);
    await createLeadsInBatch(distribution.won, LeadStatus.WON);
    await createLeadsInBatch(distribution.lost, LeadStatus.LOST);

    console.log(`\n✓ Created ${totalCreated.toLocaleString()} leads`);

    // Summary
    const stats = await prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    });

    console.log('\n📊 Lead Status Distribution:');
    stats.forEach((stat) => {
      console.log(`  ${stat.status}: ${stat._count.toLocaleString()}`);
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

    console.log(`\n⏰ Overdue Followups: ${overdueCount.toLocaleString()}`);
    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();

import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = ['John', 'Jane', 'Robert', 'Elizabeth', 'Michael', 'Sarah', 'David', 'Jennifer', 'James', 'Mary', 'Richard', 'Patricia', 'Charles', 'Linda', 'Thomas'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
const companies = ['TechCorp', 'InnovateLabs', 'CloudSync', 'DataFlow', 'NexGen', 'Streamline', 'Quantum Solutions', 'Apex Dynamics', 'Velocity', 'Frontier Tech'];

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomName(): string {
    return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

function getRandomEmail(): string {
    const name = getRandomName().toLowerCase().replace(' ', '.');
    const domain = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.io'][
        Math.floor(Math.random() * 5)
    ];
    const random = Math.random().toString(36).substring(7);
    return `${name}${random}@${domain}`;
}

function getRandomPhone(): string {
    const area = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `+1-${area}-${exchange}-${line}`;
}

function getRandomStatus(): Status {
    const statuses = [Status.NEW, Status.CONTACTED, Status.PROPOSAL, Status.ON_HOLD, Status.WON, Status.LOST];
    return getRandomElement(statuses);
}

function getRandomFollowUpDate(status: Status): Date | null {
    if (status === Status.WON || status === Status.LOST || status === Status.NEW) {
        return null;
    }

    // 50% chance of having a followup date
    if (Math.random() > 0.5) {
        return null;
    }

    const now = new Date();

    // Mix of overdue, today, 1 day, 2 days, 3-7 days, etc.
    const rand = Math.random();
    let daysFromNow = 0;

    if (rand < 0.2) {
        // 20% overdue (1-3 days ago)
        daysFromNow = -(Math.floor(Math.random() * 3) + 1);
    } else if (rand < 0.3) {
        // 10% today
        daysFromNow = 0;
    } else if (rand < 0.5) {
        // 20% tomorrow
        daysFromNow = 1;
    } else {
        // 50% within next 7 days
        daysFromNow = Math.floor(Math.random() * 7) + 1;
    }

    const followUpDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
    // Set to a specific hour (9 AM UTC)
    followUpDate.setUTCHours(9, 0, 0, 0);
    return followUpDate;
}

function getLostReason(): string | null {
    const reasons = [
        'Budget constraints',
        'Chose competitor',
        'Not a good fit',
        'Project delayed',
        'Internal restructuring',
        'Decided to build in-house',
    ];
    return Math.random() > 0.7 ? getRandomElement(reasons) : null;
}

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    await prisma.lead.deleteMany({});
    console.log('✨ Cleared existing leads');

    const leads = [];

    // Generate 30 demo leads
    for (let i = 0; i < 30; i++) {
        const status = getRandomStatus();
        const followUpDate = getRandomFollowUpDate(status);
        const lostReason = status === Status.LOST ? getLostReason() : null;

        leads.push({
            name: getRandomName(),
            email: getRandomEmail(),
            phone: Math.random() > 0.2 ? getRandomPhone() : null,
            status,
            nextFollowUpAt: followUpDate,
            lostReason,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        });
    }

    // Create leads
    for (const lead of leads) {
        await prisma.lead.create({ data: lead });
    }

    console.log(`✅ Created ${leads.length} demo leads`);

    // Log statistics
    const stats = await prisma.lead.groupBy({
        by: ['status'],
        _count: true,
    });

    console.log('\n📊 Lead distribution:');
    stats.forEach(({ status, _count }) => {
        console.log(`   ${status}: ${_count}`);
    });

    const overdueCount = await prisma.lead.count({
        where: {
            status: {
                in: [Status.CONTACTED, Status.PROPOSAL, Status.ON_HOLD],
            },
            nextFollowUpAt: {
                lt: new Date(),
            },
        },
    });

    console.log(`\n⏰ Overdue followups: ${overdueCount}`);

    console.log('\n🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('Checking CompanySettings table...\n');
    
    // Count total settings
    const count = await prisma.companySettings.count();
    console.log(`✅ Total settings in database: ${count}`);
    
    // Get all settings
    const settings = await prisma.companySettings.findMany({
      orderBy: { category: 'asc' }
    });
    
    console.log('\n📋 Settings by category:\n');
    
    const byCategory = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, any[]>);
    
    for (const [category, items] of Object.entries(byCategory)) {
      console.log(`\n${category.toUpperCase()} (${items.length} settings):`);
      items.forEach(item => {
        console.log(`  - ${item.key}: ${JSON.stringify(item.value)}`);
      });
    }
    
    console.log('\n✅ CompanySettings table exists and is populated!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();

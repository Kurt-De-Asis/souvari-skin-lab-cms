import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.services.findMany({
    where: { price: 0, deleted_at: null },
    include: {
      prices: { where: { is_available: true }, orderBy: { audience: 'asc' } }
    }
  });
  
  let updated = 0;
  for (const svc of services) {
    const nm = svc.prices.find((p: any) => p.audience === 'non_member');
    const vip = svc.prices.find((p: any) => p.audience === 'vip');
    const any = svc.prices[0];
    const price = nm ? Number(nm.amount) : vip ? Number(vip.amount) : any ? Number(any.amount) : 0;
    
    if (price > 0) {
      await prisma.services.update({ where: { id: svc.id }, data: { price } });
      updated++;
    }
  }
  console.log('Updated', updated, 'services with prices from service_prices table');
  
  const remaining = await prisma.services.count({ where: { price: 0, deleted_at: null } });
  console.log('Remaining zero-price:', remaining);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

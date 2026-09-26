import 'dotenv/config';
import { appointmentService } from './src/modules/appointments/appointments.service';

async function main() {
  // Mimic customer "Upcoming" tab: customer_id=23 (Keiffer)
  const q: any = {
    page: '1',
    limit: '10',
    customer_id: 23,
    status: 'pending,confirmed,checked_in',
    date_from: '2026-09-26',
  };
  const res = await appointmentService.list(q);
  console.log('UPCOMING total:', res.pagination?.total ?? (res as any).total, 'rows:', (res as any).items?.length ?? '?');
  console.log(JSON.stringify(res, (_k, v) => (typeof v === 'bigint' ? Number(v) : v), 1).slice(0, 2500));

  // Same but no status (all)
  const q2: any = { page: '1', limit: '10', customer_id: 23 };
  const res2 = await appointmentService.list(q2);
  console.log('\nALL total:', (res2 as any).pagination?.total);
  console.log(JSON.stringify((res2 as any).data, (_k, v) => (typeof v === 'bigint' ? Number(v) : v), 1).slice(0, 2500));
}
main().then(() => process.exit(0)).catch((e) => { console.error('ERR', e.message, e.stack?.split('\n').slice(0,4).join('\n')); process.exit(1); });
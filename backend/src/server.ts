import Fastify from 'fastify';
import cors from '@fastify/cors';
import pg from '@fastify/postgres';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) await app.register(pg, { connectionString: databaseUrl });

const demoVehicles = [
  { id:'yaris-1', name:'Toyota Yaris', type:'Economy', city:'Lomé', dailyRate:25000, rating:4.8, seats:5, transmission:'Automatic', supplier:'Lomé Drive', deposit:50000 },
  { id:'corolla-1', name:'Toyota Corolla', type:'Compact', city:'Lomé', dailyRate:35000, rating:4.9, seats:5, transmission:'Automatic', supplier:'Togo Car Rental', deposit:75000 },
  { id:'rav4-1', name:'Toyota RAV4', type:'SUV', city:'Lomé', dailyRate:55000, rating:4.8, seats:5, transmission:'Automatic', supplier:'Lomé Drive', deposit:100000 },
  { id:'hilux-1', name:'Toyota Hilux', type:'Pickup', city:'Lomé', dailyRate:65000, rating:4.7, seats:5, transmission:'Manual', supplier:'West Africa Motors', deposit:120000 },
  { id:'tucson-1', name:'Hyundai Tucson', type:'SUV', city:'Accra', dailyRate:60000, rating:4.9, seats:5, transmission:'Automatic', supplier:'Accra Auto Hire', deposit:100000 },
  { id:'picanto-1', name:'Kia Picanto', type:'Economy', city:'Cotonou', dailyRate:22000, rating:4.6, seats:4, transmission:'Manual', supplier:'Benin Mobility', deposit:50000 },
  { id:'mercedes-c-1', name:'Mercedes C-Class', type:'Premium', city:'Abidjan', dailyRate:95000, rating:4.9, seats:5, transmission:'Automatic', supplier:'Abidjan Premium Cars', deposit:150000 },
  { id:'landcruiser-1', name:'Toyota Land Cruiser', type:'SUV', city:'Lomé', dailyRate:120000, rating:5, seats:7, transmission:'Automatic', supplier:'West Africa Motors', deposit:200000 }
];

app.get('/health', async () => ({ ok:true, service:'allolouez-api', database: Boolean(databaseUrl) }));
app.get('/api/locations', async () => [...new Set(demoVehicles.map(v=>v.city))].map(city=>({city})));
app.get('/api/suppliers', async () => [...new Set(demoVehicles.map(v=>v.supplier))].map(name=>({name, verified:true})));

app.get('/api/vehicles', async (request) => {
  const q = request.query as { city?:string; type?:string };
  return demoVehicles.filter(v => (!q.city || v.city.toLowerCase()===q.city.toLowerCase()) && (!q.type || v.type===q.type));
});

app.get('/api/vehicles/:id', async (request, reply) => {
  const { id } = request.params as {id:string};
  const vehicle = demoVehicles.find(v=>v.id===id);
  if (!vehicle) return reply.code(404).send({error:'Vehicle not found'});
  return vehicle;
});

app.get('/api/availability', async (request) => {
  const q = request.query as { city?:string; startDate?:string; endDate?:string; type?:string };
  return { search:q, vehicles:demoVehicles.filter(v=>(!q.city || v.city.toLowerCase()===q.city.toLowerCase()) && (!q.type || v.type===q.type)), note:'Availability will be backed by PostgreSQL reservations in the next database migration.' };
});

app.post('/api/bookings', async (request, reply) => {
  const body = request.body as Record<string, unknown>;
  if (!body.vehicleId || !body.name || !body.email || !body.phone || !body.startDate || !body.endDate) return reply.code(400).send({error:'vehicleId, name, email, phone, startDate and endDate are required'});
  const vehicle = demoVehicles.find(v=>v.id===body.vehicleId);
  if (!vehicle) return reply.code(404).send({error:'Vehicle not found'});
  const booking = { id:`BK-${Date.now()}`, status:'pending', createdAt:new Date().toISOString(), ...body, vehicle };
  return reply.code(201).send(booking);
});

const port = Number(process.env.PORT || 10000);
app.listen({ port, host:'0.0.0.0' }).catch(err=>{ app.log.error(err); process.exit(1); });

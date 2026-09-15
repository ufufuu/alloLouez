import Fastify from 'fastify';
import cors from '@fastify/cors';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';

const { Pool } = pg;
const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, max: 5 }) : null;
let dbReady = false;

const demoVehicles = [
  { id:'yaris-1', name:'Toyota Yaris', type:'Economy', city:'Lomé', country:'Togo', dailyRate:25000, rating:4.8, seats:5, transmission:'Automatic', supplier:'Lomé Drive', deposit:50000 },
  { id:'corolla-1', name:'Toyota Corolla', type:'Compact', city:'Lomé', country:'Togo', dailyRate:35000, rating:4.9, seats:5, transmission:'Automatic', supplier:'Togo Car Rental', deposit:75000 },
  { id:'rav4-1', name:'Toyota RAV4', type:'SUV', city:'Lomé', country:'Togo', dailyRate:55000, rating:4.8, seats:5, transmission:'Automatic', supplier:'Lomé Drive', deposit:100000 },
  { id:'hilux-1', name:'Toyota Hilux', type:'Pickup', city:'Lomé', country:'Togo', dailyRate:65000, rating:4.7, seats:5, transmission:'Manual', supplier:'West Africa Motors', deposit:120000 },
  { id:'tucson-1', name:'Hyundai Tucson', type:'SUV', city:'Accra', country:'Ghana', dailyRate:60000, rating:4.9, seats:5, transmission:'Automatic', supplier:'Accra Auto Hire', deposit:100000 },
  { id:'picanto-1', name:'Kia Picanto', type:'Economy', city:'Cotonou', country:'Bénin', dailyRate:22000, rating:4.6, seats:4, transmission:'Manual', supplier:'Benin Mobility', deposit:50000 },
  { id:'mercedes-c-1', name:'Mercedes C-Class', type:'Premium', city:'Abidjan', country:'Côte d’Ivoire', dailyRate:95000, rating:4.9, seats:5, transmission:'Automatic', supplier:'Abidjan Premium Cars', deposit:150000 },
  { id:'landcruiser-1', name:'Toyota Land Cruiser', type:'SUV', city:'Lomé', country:'Togo', dailyRate:120000, rating:5, seats:7, transmission:'Automatic', supplier:'West Africa Motors', deposit:200000 }
];

async function migrate() {
  if (!pool) return;
  try {
    const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/schema.sql');
    const sql = await readFile(schemaPath, 'utf8');
    await pool.query(sql);
    dbReady = true;
    app.log.info('AlloLouez PostgreSQL schema ready');
  } catch (error) {
    app.log.error(error, 'PostgreSQL unavailable; API will use demo fallback');
  }
}
await migrate();

app.get('/health', async () => ({ ok:true, service:'allolouez-api', databaseConfigured:Boolean(databaseUrl), databaseReady:dbReady }));

app.get('/api/locations', async () => {
  if (dbReady && pool) return (await pool.query('SELECT id, city, country, code FROM allolouez.locations WHERE active=true ORDER BY city')).rows;
  return [...new Set(demoVehicles.map(v=>v.city))].map(city=>({ city }));
});

app.get('/api/suppliers', async () => {
  if (dbReady && pool) return (await pool.query('SELECT id,name,email,phone,verified,active FROM allolouez.suppliers ORDER BY name')).rows;
  return [...new Set(demoVehicles.map(v=>v.supplier))].map(name=>({name,verified:true}));
});

app.get('/api/vehicles', async (request) => {
  const q = request.query as { city?:string; type?:string; startDate?:string; endDate?:string };
  if (dbReady && pool) {
    const params: string[] = [];
    const where: string[] = ['v.active=true'];
    if (q.city) { params.push(q.city); where.push(`l.city=$${params.length}`); }
    if (q.type && q.type !== 'All') { params.push(q.type); where.push(`v.type=$${params.length}`); }
    if (q.startDate && q.endDate) {
      params.push(q.startDate, q.endDate);
      where.push(`NOT EXISTS (SELECT 1 FROM allolouez.bookings b WHERE b.vehicle_id=v.id AND b.status IN ('pending','confirmed') AND b.start_date <= $${params.length}::date AND b.end_date >= $${params.length-1}::date)`);
    }
    const sql=`SELECT v.id,v.name,v.type,v.daily_rate AS "dailyRate",v.deposit,v.seats,v.transmission,v.rating,s.name AS supplier,l.city,l.country FROM allolouez.vehicles v JOIN allolouez.suppliers s ON s.id=v.supplier_id JOIN allolouez.locations l ON l.id=v.location_id WHERE ${where.join(' AND ')} ORDER BY v.rating DESC,v.daily_rate ASC`;
    return (await pool.query(sql, params)).rows;
  }
  return demoVehicles.filter(v => (!q.city || v.city.toLowerCase()===q.city.toLowerCase()) && (!q.type || q.type==='All' || v.type===q.type));
});

app.get('/api/vehicles/:id', async (request, reply) => {
  const { id } = request.params as {id:string};
  if (dbReady && pool) {
    const r=await pool.query('SELECT v.id,v.name,v.type,v.daily_rate AS "dailyRate",v.deposit,v.seats,v.transmission,v.rating,s.name AS supplier,s.verified,l.city,l.country FROM allolouez.vehicles v JOIN allolouez.suppliers s ON s.id=v.supplier_id JOIN allolouez.locations l ON l.id=v.location_id WHERE v.id=$1',[id]);
    if (!r.rowCount) return reply.code(404).send({error:'Véhicule introuvable'});
    return r.rows[0];
  }
  const vehicle=demoVehicles.find(v=>v.id===id); if(!vehicle) return reply.code(404).send({error:'Véhicule introuvable'}); return vehicle;
});

app.get('/api/availability', async (request) => {
  const q = request.query as { city?:string; startDate?:string; endDate?:string; type?:string };
  const vehicles=await app.inject({method:'GET',url:`/api/vehicles?${new URLSearchParams(q as Record<string,string>).toString()}`});
  return { search:q, vehicles:JSON.parse(vehicles.body) };
});

const bookingSchema=z.object({vehicleId:z.string().min(1),name:z.string().min(2),email:z.string().email(),phone:z.string().min(5),startDate:z.string(),endDate:z.string(),notes:z.string().optional().default('')});
app.post('/api/bookings', async (request, reply) => {
  const parsed=bookingSchema.safeParse(request.body); if(!parsed.success) return reply.code(400).send({error:'Données de réservation invalides',details:parsed.error.flatten()});
  const b=parsed.data;
  if (dbReady && pool) {
    const client=await pool.connect();
    try {
      await client.query('BEGIN');
      const vehicle=(await client.query('SELECT id,daily_rate,deposit FROM allolouez.vehicles WHERE id=$1 AND active=true FOR UPDATE',[b.vehicleId])).rows[0];
      if(!vehicle) { await client.query('ROLLBACK'); return reply.code(404).send({error:'Véhicule introuvable'}); }
      const overlap=await client.query("SELECT 1 FROM allolouez.bookings WHERE vehicle_id=$1 AND status IN ('pending','confirmed') AND start_date <= $3::date AND end_date >= $2::date LIMIT 1",[b.vehicleId,b.startDate,b.endDate]);
      if(overlap.rowCount) { await client.query('ROLLBACK'); return reply.code(409).send({error:'Véhicule non disponible pour ces dates'}); }
      let customer=(await client.query('SELECT id FROM allolouez.customers WHERE lower(email)=lower($1) LIMIT 1',[b.email])).rows[0];
      if(!customer) customer=(await client.query('INSERT INTO allolouez.customers(full_name,email,phone) VALUES($1,$2,$3) RETURNING id',[b.name,b.email,b.phone])).rows[0];
      const days=Math.max(1,Math.ceil((new Date(b.endDate).getTime()-new Date(b.startDate).getTime())/86400000));
      const total=Number(vehicle.daily_rate)*days;
      const reference=`AL-${Date.now().toString().slice(-8)}`;
      const result=await client.query('INSERT INTO allolouez.bookings(reference,vehicle_id,customer_id,start_date,end_date,total_amount,deposit_amount,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,reference,status,created_at AS "createdAt"',[reference,b.vehicleId,customer.id,b.startDate,b.endDate,total,vehicle.deposit,'pending',b.notes]);
      await client.query('INSERT INTO allolouez.commissions(booking_id,supplier_amount,platform_amount) VALUES($1,$2,$3)',[result.rows[0].id,total,0]);
      await client.query('COMMIT');
      return reply.code(201).send({...result.rows[0],totalAmount:total,depositAmount:vehicle.deposit});
    } catch(error) { await client.query('ROLLBACK'); app.log.error(error); return reply.code(500).send({error:'Impossible de créer la réservation'}); } finally { client.release(); }
  }
  return reply.code(201).send({id:`demo-${Date.now()}`,reference:`AL-${Date.now().toString().slice(-8)}`,status:'pending',...b});
});

app.get('/api/bookings', async () => {
  if(!dbReady || !pool) return [];
  return (await pool.query(`SELECT b.id,b.reference,b.status,b.start_date AS "startDate",b.end_date AS "endDate",b.total_amount AS "totalAmount",c.full_name AS "customer",c.email,c.phone,v.name AS "vehicle",l.city,s.name AS supplier FROM allolouez.bookings b JOIN allolouez.customers c ON c.id=b.customer_id JOIN allolouez.vehicles v ON v.id=b.vehicle_id JOIN allolouez.locations l ON l.id=v.location_id JOIN allolouez.suppliers s ON s.id=v.supplier_id ORDER BY b.created_at DESC`)).rows;
});

app.get('/api/dashboard', async () => {
  if(!dbReady || !pool) return {bookings:0,vehicles:demoVehicles.length,suppliers:6,revenue:0,recentBookings:[]};
  const [bookings,vehicles,suppliers,revenue,recentBookings]=await Promise.all([
    pool.query('SELECT count(*)::int AS count FROM allolouez.bookings'),pool.query('SELECT count(*)::int AS count FROM allolouez.vehicles WHERE active=true'),pool.query('SELECT count(*)::int AS count FROM allolouez.suppliers WHERE active=true'),pool.query("SELECT COALESCE(sum(total_amount),0)::int AS total FROM allolouez.bookings WHERE status IN ('confirmed','completed')"),pool.query(`SELECT b.reference,b.status,b.start_date AS "startDate",c.full_name AS customer,v.name AS vehicle,l.city FROM allolouez.bookings b JOIN allolouez.customers c ON c.id=b.customer_id JOIN allolouez.vehicles v ON v.id=b.vehicle_id JOIN allolouez.locations l ON l.id=v.location_id ORDER BY b.created_at DESC LIMIT 10`)
  ]);
  return {bookings:bookings.rows[0].count,vehicles:vehicles.rows[0].count,suppliers:suppliers.rows[0].count,revenue:revenue.rows[0].total,recentBookings:recentBookings.rows};
});

const port=Number(process.env.PORT||10000);
app.listen({port,host:'0.0.0.0'}).catch(err=>{app.log.error(err);process.exit(1)});

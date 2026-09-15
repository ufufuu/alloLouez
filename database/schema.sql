CREATE SCHEMA IF NOT EXISTS allolouez;
SET search_path TO allolouez;

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL,
  code VARCHAR(10),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(city, country)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(180) NOT NULL,
  email VARCHAR(180),
  phone VARCHAR(60),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  name VARCHAR(180) NOT NULL,
  type VARCHAR(40) NOT NULL,
  daily_rate INTEGER NOT NULL CHECK (daily_rate >= 0),
  deposit INTEGER NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  seats INTEGER NOT NULL DEFAULT 5,
  transmission VARCHAR(30) NOT NULL DEFAULT 'Automatic',
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(60) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(30) NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'XOF',
  provider VARCHAR(60),
  provider_reference VARCHAR(180),
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  supplier_amount INTEGER NOT NULL DEFAULT 0,
  platform_amount INTEGER NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'XOF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_supplier ON vehicles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates ON bookings(vehicle_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

INSERT INTO locations(city,country,code) VALUES
('Lomé','Togo','TG'),('Accra','Ghana','GH'),('Cotonou','Bénin','BJ'),('Abidjan','Côte d’Ivoire','CI')
ON CONFLICT (city,country) DO NOTHING;

INSERT INTO suppliers(name,verified) VALUES
('Lomé Drive',true),('Togo Car Rental',true),('West Africa Motors',true),('Accra Auto Hire',true),('Benin Mobility',true),('Abidjan Premium Cars',true)
ON CONFLICT DO NOTHING;

INSERT INTO vehicles(supplier_id,location_id,name,type,daily_rate,deposit,seats,transmission,rating)
SELECT s.id,l.id,v.name,v.type,v.rate,v.deposit,v.seats,v.trans,v.rating
FROM (VALUES
 ('Lomé Drive','Lomé','Toyota Yaris','Economy',25000,50000,5,'Automatic',4.8),
 ('Togo Car Rental','Lomé','Toyota Corolla','Compact',35000,75000,5,'Automatic',4.9),
 ('Lomé Drive','Lomé','Toyota RAV4','SUV',55000,100000,5,'Automatic',4.8),
 ('West Africa Motors','Lomé','Toyota Hilux','Pickup',65000,120000,5,'Manual',4.7),
 ('Accra Auto Hire','Accra','Hyundai Tucson','SUV',60000,100000,5,'Automatic',4.9),
 ('Benin Mobility','Cotonou','Kia Picanto','Economy',22000,50000,4,'Manual',4.6),
 ('Abidjan Premium Cars','Abidjan','Mercedes C-Class','Premium',95000,150000,5,'Automatic',4.9),
 ('West Africa Motors','Lomé','Toyota Land Cruiser','SUV',120000,200000,7,'Automatic',5.0)
) AS v(supplier,city,name,type,rate,deposit,seats,trans,rating)
JOIN suppliers s ON s.name=v.supplier
JOIN locations l ON l.city=v.city
WHERE NOT EXISTS (SELECT 1 FROM vehicles x WHERE x.name=v.name AND x.location_id=l.id);

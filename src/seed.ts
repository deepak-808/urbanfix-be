/**
 * Database seed script — populates the DB with demo data for development and testing.
 *
 * Run with:   npx ts-node -r tsconfig-paths/register src/seed.ts
 * Or after build: node dist/seed.js
 *
 * WARNING: This script DROPS and RECREATES the users, providers, categories and
 * reviews collections. Never run it against a production database.
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/urbanfix';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Clear existing data so re-runs are idempotent
  await db.collection('users').deleteMany({});
  await db.collection('providers').deleteMany({});
  await db.collection('categories').deleteMany({});
  await db.collection('reviews').deleteMany({});

  // ── Categories ────────────────────────────────────────────────────────────
  // Icon strings match the keys in the frontend's iconMap (CategoryCard component)
  const categories = await db.collection('categories').insertMany([
    { name: 'AC Repair',    icon: 'AirVent',       description: 'Air conditioning installation, maintenance & repair', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Plumbing',     icon: 'Droplets',       description: 'Pipe repairs, leaks, installations & drainage',       createdAt: new Date(), updatedAt: new Date() },
    { name: 'Electrician',  icon: 'Zap',            description: 'Wiring, fixtures, panels & electrical repairs',        createdAt: new Date(), updatedAt: new Date() },
    { name: 'Laundry',      icon: 'WashingMachine', description: 'Wash, dry, iron & fold services',                     createdAt: new Date(), updatedAt: new Date() },
    { name: 'Cleaning',     icon: 'Sparkles',       description: 'Home & office deep cleaning services',                 createdAt: new Date(), updatedAt: new Date() },
    { name: 'Painting',     icon: 'PaintBucket',    description: 'Interior & exterior painting services',                createdAt: new Date(), updatedAt: new Date() },
    { name: 'Carpentry',    icon: 'Hammer',         description: 'Furniture repair, installation & custom woodwork',     createdAt: new Date(), updatedAt: new Date() },
    { name: 'Pest Control', icon: 'Bug',            description: 'Termite, rodent & insect control services',           createdAt: new Date(), updatedAt: new Date() },
  ]);

  const [acId, plumbId, elecId, , cleanId] = Object.values(categories.insertedIds);

  // ── Users ─────────────────────────────────────────────────────────────────
  // All demo accounts share the same hashed password for convenience
  const hash = await bcrypt.hash('password123', 10);
  const users = await db.collection('users').insertMany([
    { name: 'Alice Johnson', email: 'user@demo.com',     phone: '+1 (555) 001-0001', passwordHash: hash, role: 'user',     createdAt: new Date(), updatedAt: new Date() },
    { name: 'Bob Smith',     email: 'provider@demo.com', phone: '+1 (555) 001-0010', passwordHash: hash, role: 'provider', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Admin User',    email: 'admin@demo.com',    phone: '+1 (555) 001-0099', passwordHash: hash, role: 'admin',    createdAt: new Date(), updatedAt: new Date() },
    { name: 'Sarah M.',      email: 'sarah@demo.com',    phone: '+1 (555) 002-0001', passwordHash: hash, role: 'user',     createdAt: new Date(), updatedAt: new Date() },
    { name: 'James K.',      email: 'james@demo.com',    phone: '+1 (555) 002-0002', passwordHash: hash, role: 'user',     createdAt: new Date(), updatedAt: new Date() },
  ]);

  const [aliceId, bobId, , sarahId, jamesId] = Object.values(users.insertedIds);

  // ── Providers ─────────────────────────────────────────────────────────────
  // Bob owns the CoolBreeze profile; the others use random ObjectIds
  // (in a real seed you would create user accounts for each provider)
  const providers = await db.collection('providers').insertMany([
    {
      userId: bobId,
      businessName: 'CoolBreeze AC Services',
      categoryId: acId,
      location: 'Downtown, New York',
      bio: '10+ years of experience in AC installation, maintenance and repair.',
      rating: 4.8, reviewCount: 2, verified: true,
      phone: '+1 (555) 100-2001', email: 'coolbreeze@example.com',
      experience: '10 years', availability: 'Mon–Sun, 8am–8pm',
      images: [],
      services: [
        { name: 'AC Installation', description: 'Full unit setup',       price: 120, unit: 'per unit',  duration: '3–4 hrs' },
        { name: 'AC Servicing',    description: 'Cleaning & maintenance', price: 45,  unit: 'per visit', duration: '1–2 hrs' },
        { name: 'AC Repair',       description: 'Diagnosis & fix',        price: 60,  unit: 'starting',  duration: '2–3 hrs' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      userId: new mongoose.Types.ObjectId(),
      businessName: 'QuickFix Plumbing',
      categoryId: plumbId,
      location: 'Brooklyn, New York',
      bio: 'Licensed plumbers available 24/7 for emergencies.',
      rating: 4.6, reviewCount: 1, verified: true,
      phone: '+1 (555) 100-2002', email: 'quickfix@example.com',
      experience: '8 years', availability: '24/7 Emergency',
      images: [],
      services: [
        { name: 'Leak Repair',   description: 'Fix pipe & faucet leaks', price: 40, unit: 'starting',   duration: '30–60 min' },
        { name: 'Drain Cleaning', description: 'Unclog drains',          price: 55, unit: 'per drain',   duration: '1 hr' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      userId: new mongoose.Types.ObjectId(),
      businessName: 'Spark Electric Co.',
      categoryId: elecId,
      location: 'Queens, New York',
      bio: 'Certified master electricians. Residential and commercial electrical work.',
      rating: 4.9, reviewCount: 1, verified: true,
      phone: '+1 (555) 100-2003', email: 'spark@example.com',
      experience: '15 years', availability: 'Mon–Sat, 7am–7pm',
      images: [],
      services: [
        { name: 'Wiring & Rewiring', description: 'New or updated wiring',  price: 90,  unit: 'per hour', duration: 'varies' },
        { name: 'Panel Upgrade',     description: 'Electrical panel service', price: 350, unit: 'starting', duration: '4–6 hrs' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]);

  const [coolbreezeId, , sparkId] = Object.values(providers.insertedIds);

  // ── Reviews ───────────────────────────────────────────────────────────────
  await db.collection('reviews').insertMany([
    { userId: sarahId, providerId: coolbreezeId, rating: 5, comment: 'Excellent service! The technician arrived on time.', createdAt: new Date(), updatedAt: new Date() },
    { userId: jamesId, providerId: coolbreezeId, rating: 5, comment: 'Best AC service in the city. Fair pricing.',          createdAt: new Date(), updatedAt: new Date() },
    { userId: aliceId, providerId: sparkId,      rating: 5, comment: 'Spark Electric did an amazing panel upgrade.',         createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log('✓ Seed complete!');
  console.log('\nDemo accounts (password: password123):');
  console.log('  user@demo.com     → User');
  console.log('  provider@demo.com → Provider (owns CoolBreeze AC Services)');
  console.log('  admin@demo.com    → Admin');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

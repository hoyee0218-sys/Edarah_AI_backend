import bcrypt from 'bcryptjs';
import {
  Hotel,
  User,
  Guest,
  RoomType,
  Room,
  Reservation,
  Stay,
  Charge,
  Invoice,
  AuditLog,
} from '../models/index.js';
import { generateInvoiceNumber } from '../utils/helpers.js';

async function clearAll() {
  await Promise.all([
    AuditLog.deleteMany({}),
    Invoice.deleteMany({}),
    Charge.deleteMany({}),
    Stay.deleteMany({}),
    Reservation.deleteMany({}),
    Room.deleteMany({}),
    RoomType.deleteMany({}),
    Guest.deleteMany({}),
    User.deleteMany({}),
    Hotel.deleteMany({}),
  ]);
}

/**
 * Seeds demo data only when the database has no users yet (first startup).
 */
export async function seedDatabaseIfEmpty() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Seed skipped — database already has data');
    return;
  }

  await seedDemoData();
}

/** Full wipe + seed (used by `npm run db:seed`). */
export async function seedDemoData() {
  console.log('Seeding initial demo data…');
  await clearAll();

  const hotel = await Hotel.create({
    name: 'Edarah Grand Hotel',
    address: '12 Corniche Road, Alexandria',
    phone: '+20 3 555 0100',
    email: 'front@edarah.ai',
  });

  await User.create({
    hotelId: hotel._id,
    email: 'admin@edarah.ai',
    passwordHash: await bcrypt.hash('admin123', 10),
    fullName: 'Front Office Manager',
    role: 'admin',
  });

  await User.create({
    hotelId: hotel._id,
    email: 'desk@edarah.ai',
    passwordHash: await bcrypt.hash('desk123', 10),
    fullName: 'Reception Agent',
    role: 'front_desk',
  });

  const [standard, deluxe, suite] = await RoomType.create([
    {
      hotelId: hotel._id,
      name: 'Standard Twin',
      description: 'Comfortable twin room with city view',
      basePrice: 85,
      capacity: 2,
      amenities: JSON.stringify(['WiFi', 'AC', 'TV']),
    },
    {
      hotelId: hotel._id,
      name: 'Deluxe King',
      description: 'Spacious king room with balcony',
      basePrice: 140,
      capacity: 2,
      amenities: JSON.stringify(['WiFi', 'AC', 'TV', 'Minibar', 'Balcony']),
    },
    {
      hotelId: hotel._id,
      name: 'Executive Suite',
      description: 'Suite with living area and sea view',
      basePrice: 240,
      capacity: 3,
      amenities: JSON.stringify([
        'WiFi',
        'AC',
        'TV',
        'Minibar',
        'Lounge',
        'Sea View',
      ]),
    },
  ]);

  await Room.insertMany([
    { hotelId: hotel._id, number: '101', floor: 1, roomTypeId: standard!._id, status: 'dirty' },
    { hotelId: hotel._id, number: '102', floor: 1, roomTypeId: standard!._id, status: 'available' },
    { hotelId: hotel._id, number: '103', floor: 1, roomTypeId: standard!._id, status: 'dirty' },
    { hotelId: hotel._id, number: '201', floor: 2, roomTypeId: deluxe!._id, status: 'occupied' },
    { hotelId: hotel._id, number: '202', floor: 2, roomTypeId: deluxe!._id, status: 'occupied' },
    { hotelId: hotel._id, number: '203', floor: 2, roomTypeId: deluxe!._id, status: 'available' },
    { hotelId: hotel._id, number: '301', floor: 3, roomTypeId: suite!._id, status: 'available' },
    { hotelId: hotel._id, number: '302', floor: 3, roomTypeId: suite!._id, status: 'available' },
  ]);

  const guests = await Guest.create([
    {
      hotelId: hotel._id,
      firstName: 'Sara',
      lastName: 'Hassan',
      email: 'sara.hassan@email.com',
      phone: '+20 100 111 2233',
      nationality: 'Egyptian',
    },
    {
      hotelId: hotel._id,
      firstName: 'James',
      lastName: 'Walker',
      email: 'james.walker@email.com',
      phone: '+44 7700 900123',
      nationality: 'British',
    },
    {
      hotelId: hotel._id,
      firstName: 'Layla',
      lastName: 'Mansour',
      email: 'layla.m@email.com',
      phone: '+971 50 123 4567',
      nationality: 'Emirati',
    },
    {
      hotelId: hotel._id,
      firstName: 'Omar',
      lastName: 'Farouk',
      email: 'omar.farouk@email.com',
      phone: '+20 122 555 8899',
      nationality: 'Egyptian',
    },
  ]);

  const today = new Date();
  today.setHours(14, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 3);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const room101 = await Room.findOne({ hotelId: hotel._id, number: '101' });
  const room103 = await Room.findOne({ hotelId: hotel._id, number: '103' });
  const room201 = await Room.findOne({ hotelId: hotel._id, number: '201' });
  const room202 = await Room.findOne({ hotelId: hotel._id, number: '202' });

  // Arrival today (dashboard Arrivals)
  await Reservation.create({
    hotelId: hotel._id,
    guestId: guests[0]!._id,
    roomTypeId: deluxe!._id,
    checkInDate: today,
    checkOutDate: dayAfter,
    adults: 2,
    status: 'confirmed',
    notes: 'Late arrival expected',
  });

  // In-house stay — still staying (checkout tomorrow)
  const inHouseRes = await Reservation.create({
    hotelId: hotel._id,
    guestId: guests[1]!._id,
    roomTypeId: deluxe!._id,
    roomId: room201!._id,
    checkInDate: yesterday,
    checkOutDate: tomorrow,
    adults: 1,
    status: 'checked_in',
  });

  const inHouseStay = await Stay.create({
    hotelId: hotel._id,
    reservationId: inHouseRes._id,
    guestId: guests[1]!._id,
    roomId: room201!._id,
    checkedInAt: yesterday,
    status: 'active',
    notes: 'Prefers quiet floor',
  });

  await Charge.create({
    stayId: inHouseStay._id,
    description: 'Minibar – sparkling water',
    category: 'minibar',
    amount: 8,
    quantity: 2,
  });

  // Departure today (dashboard Departures)
  const departureRes = await Reservation.create({
    hotelId: hotel._id,
    guestId: guests[2]!._id,
    roomTypeId: deluxe!._id,
    roomId: room202!._id,
    checkInDate: yesterday,
    checkOutDate: today,
    adults: 2,
    status: 'checked_in',
    notes: 'Early taxi requested',
  });

  await Stay.create({
    hotelId: hotel._id,
    reservationId: departureRes._id,
    guestId: guests[2]!._id,
    roomId: room202!._id,
    checkedInAt: yesterday,
    status: 'active',
    notes: 'Checking out today',
  });

  // Upcoming reservation
  await Reservation.create({
    hotelId: hotel._id,
    guestId: guests[3]!._id,
    roomTypeId: suite!._id,
    checkInDate: tomorrow,
    checkOutDate: dayAfter,
    adults: 2,
    children: 1,
    status: 'confirmed',
  });

  // Completed stay #1 + invoice (recent invoices / today revenue)
  const completedRes1 = await Reservation.create({
    hotelId: hotel._id,
    guestId: guests[3]!._id,
    roomTypeId: standard!._id,
    roomId: room101!._id,
    checkInDate: twoDaysAgo,
    checkOutDate: today,
    adults: 1,
    status: 'checked_out',
  });

  const completedStay1 = await Stay.create({
    hotelId: hotel._id,
    reservationId: completedRes1._id,
    guestId: guests[3]!._id,
    roomId: room101!._id,
    checkedInAt: twoDaysAgo,
    checkedOutAt: today,
    status: 'completed',
  });

  await Charge.create({
    stayId: completedStay1._id,
    description: 'Laundry service',
    category: 'laundry',
    amount: 25,
    quantity: 1,
  });

  const roomTotal1 = 2 * 85; // 2 nights × Standard Twin
  const chargesTotal1 = 25;
  const tax1 = Number(((roomTotal1 + chargesTotal1) * 0.1).toFixed(2));

  await Invoice.create({
    stayId: completedStay1._id,
    invoiceNumber: generateInvoiceNumber(),
    roomTotal: roomTotal1,
    chargesTotal: chargesTotal1,
    taxAmount: tax1,
    grandTotal: Number((roomTotal1 + chargesTotal1 + tax1).toFixed(2)),
    status: 'paid',
    issuedAt: today,
    paidAt: today,
  });

  // Completed stay #2 + invoice
  const completedRes2 = await Reservation.create({
    hotelId: hotel._id,
    guestId: guests[0]!._id,
    roomTypeId: standard!._id,
    roomId: room103!._id,
    checkInDate: threeDaysAgo,
    checkOutDate: yesterday,
    adults: 2,
    status: 'checked_out',
  });

  const completedStay2 = await Stay.create({
    hotelId: hotel._id,
    reservationId: completedRes2._id,
    guestId: guests[0]!._id,
    roomId: room103!._id,
    checkedInAt: threeDaysAgo,
    checkedOutAt: yesterday,
    status: 'completed',
  });

  await Charge.create({
    stayId: completedStay2._id,
    description: 'Restaurant dinner',
    category: 'restaurant',
    amount: 48,
    quantity: 2,
  });

  const roomTotal2 = 2 * 85;
  const chargesTotal2 = 96;
  const tax2 = Number(((roomTotal2 + chargesTotal2) * 0.1).toFixed(2));
  const issuedThisMorning = new Date(today);
  issuedThisMorning.setHours(9, 30, 0, 0);

  await Invoice.create({
    stayId: completedStay2._id,
    invoiceNumber: generateInvoiceNumber(),
    roomTotal: roomTotal2,
    chargesTotal: chargesTotal2,
    taxAmount: tax2,
    grandTotal: Number((roomTotal2 + chargesTotal2 + tax2).toFixed(2)),
    status: 'issued',
    issuedAt: issuedThisMorning,
  });

  console.log('Seed complete');
  console.log('Login: admin@edarah.ai / admin123');
  console.log('Login: desk@edarah.ai / desk123');
  console.log('Dashboard: 1 arrival, 1 departure, 2 recent invoices');
}

/** Allow `npm run db:seed` to wipe and reseed. */
async function runCli() {
  const { connectDatabase } = await import('./connect.js');
  const mongoose = (await import('mongoose')).default;
  await connectDatabase();
  await seedDemoData();
  await mongoose.disconnect();
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));

if (isDirectRun) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

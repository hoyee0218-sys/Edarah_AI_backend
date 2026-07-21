import {
  Charge,
  Invoice,
  Reservation,
  Room,
  Stay,
} from '../../models/index.js';
import { idOf } from '../../models/plugins.js';
import { config } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import {
  generateInvoiceNumber,
  nightsBetween,
} from '../../utils/helpers.js';
import { toApi, toApiList } from '../../utils/serialize.js';

const CHARGE_CATEGORIES = [
  'room',
  'minibar',
  'restaurant',
  'laundry',
  'other',
] as const;

type ChargeCategory = (typeof CHARGE_CATEGORIES)[number];

function parseChargeCategory(value?: string): ChargeCategory {
  const category = value || 'other';
  if ((CHARGE_CATEGORIES as readonly string[]).includes(category)) {
    return category as ChargeCategory;
  }
  throw new AppError(
    `Invalid category. Allowed: ${CHARGE_CATEGORIES.join(', ')}`,
  );
}
async function populateStay(stayId: string) {
  return Stay.findById(stayId)
    .populate('guest')
    .populate({ path: 'room', populate: { path: 'roomType' } })
    .populate({ path: 'reservation', populate: { path: 'roomType' } })
    .populate({ path: 'charges', options: { sort: { createdAt: 1 } } })
    .populate('invoice');
}

export async function listStays(
  hotelId: string,
  query?: { status?: string },
) {
  const filter: Record<string, unknown> = { hotelId };
  if (query?.status) filter.status = query.status;

  const stays = await Stay.find(filter)
    .sort({ checkedInAt: -1 })
    .populate('guest')
    .populate({ path: 'room', populate: { path: 'roomType' } })
    .populate('reservation')
    .populate('charges')
    .populate('invoice');

  return toApiList(stays);
}

export async function getStay(hotelId: string, id: string) {
  const stay = await populateStay(id);
  if (!stay || idOf(stay.hotelId) !== hotelId) {
    throw new AppError('Stay not found', 404);
  }
  return toApi(stay) as Record<string, unknown>;
}

export async function checkIn(
  hotelId: string,
  data: { reservationId: string; roomId: string; notes?: string },
) {
  const reservation = await Reservation.findOne({
    _id: data.reservationId,
    hotelId,
  }).populate('stay');

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'confirmed') {
    throw new AppError('Only confirmed reservations can be checked in');
  }
  if (reservation.stay) {
    throw new AppError('Reservation already has a stay');
  }

  const room = await Room.findOne({ _id: data.roomId, hotelId });
  if (!room) throw new AppError('Room not found', 404);
  if (idOf(room.roomTypeId) !== idOf(reservation.roomTypeId)) {
    throw new AppError('Room type does not match reservation');
  }
  if (room.status === 'occupied' || room.status === 'out_of_order') {
    throw new AppError(`Room is ${room.status} and cannot be assigned`);
  }

  const stay = await Stay.create({
    hotelId,
    reservationId: reservation._id,
    guestId: reservation.guestId,
    roomId: room._id,
    notes: data.notes?.trim() || null,
    status: 'active',
  });

  reservation.status = 'checked_in';
  reservation.roomId = room._id as never;
  await reservation.save();

  room.status = 'occupied';
  await room.save();

  const full = await populateStay(idOf(stay._id));
  return toApi(full);
}

export async function updateStayNotes(
  hotelId: string,
  id: string,
  notes: string,
) {
  const stay = await Stay.findOne({ _id: id, hotelId });
  if (!stay) throw new AppError('Stay not found', 404);

  stay.notes = notes?.trim() || null;
  await stay.save();

  const full = await populateStay(id);
  return toApi(full);
}

export async function addCharge(
  hotelId: string,
  stayId: string,
  data: {
    description: string;
    category?: string;
    amount: number;
    quantity?: number;
  },
) {
  const stay = await Stay.findOne({ _id: stayId, hotelId });
  if (!stay) throw new AppError('Stay not found', 404);
  if (stay.status !== 'active') {
    throw new AppError('Cannot add charges to a completed stay');
  }
  if (!data.description?.trim() || data.amount == null) {
    throw new AppError('Description and amount are required');
  }

  const charge = await Charge.create({
    stayId,
    description: data.description.trim(),
    category: parseChargeCategory(data.category),
    amount: Number(data.amount),
    quantity: data.quantity ?? 1,
  });

  return toApi(charge);
}

export async function calculateBill(hotelId: string, stayId: string) {
  const stay = (await getStay(hotelId, stayId)) as {
    id: string;
    checkedOutAt?: string | null;
    reservation: { checkInDate: string; checkOutDate: string };
    room: { roomType: { basePrice: number } };
    charges: Array<{ amount: number; quantity: number }>;
  };

  const nights = nightsBetween(
    new Date(stay.reservation.checkInDate),
    stay.checkedOutAt
      ? new Date(stay.checkedOutAt)
      : new Date(stay.reservation.checkOutDate),
  );
  const roomRate = stay.room.roomType.basePrice;
  const roomTotal = nights * roomRate;
  const chargesTotal = stay.charges.reduce(
    (sum, c) => sum + c.amount * c.quantity,
    0,
  );
  const subtotal = roomTotal + chargesTotal;
  const taxAmount = Number((subtotal * config.taxRate).toFixed(2));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));

  return {
    stayId: stay.id,
    nights,
    roomRate,
    roomTotal,
    charges: stay.charges,
    chargesTotal,
    taxRate: config.taxRate,
    taxAmount,
    grandTotal,
  };
}

export async function checkOut(hotelId: string, stayId: string) {
  const stayDoc = await Stay.findOne({ _id: stayId, hotelId });
  if (!stayDoc) throw new AppError('Stay not found', 404);
  if (stayDoc.status !== 'active') {
    throw new AppError('Stay is already completed');
  }

  const existingInvoice = await Invoice.findOne({ stayId });
  if (existingInvoice) {
    throw new AppError('Invoice already generated for this stay');
  }

  const bill = await calculateBill(hotelId, stayId);
  const invoiceNumber = generateInvoiceNumber();

  const invoice = await Invoice.create({
    stayId,
    invoiceNumber,
    roomTotal: bill.roomTotal,
    chargesTotal: bill.chargesTotal,
    taxAmount: bill.taxAmount,
    grandTotal: bill.grandTotal,
    status: 'issued',
  });

  stayDoc.status = 'completed';
  stayDoc.checkedOutAt = new Date();
  await stayDoc.save();

  await Reservation.updateOne(
    { _id: stayDoc.reservationId },
    { $set: { status: 'checked_out' } },
  );

  await Room.updateOne(
    { _id: stayDoc.roomId },
    { $set: { status: 'dirty' } },
  );

  const updatedStay = await populateStay(stayId);

  return {
    stay: toApi(updatedStay),
    invoice: toApi(invoice),
    bill,
  };
}

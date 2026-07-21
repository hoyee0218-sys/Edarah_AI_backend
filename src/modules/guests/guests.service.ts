import { Guest, Reservation, Stay } from '../../models/index.js';
import { AppError } from '../../utils/errors.js';
import { toApi, toApiList } from '../../utils/serialize.js';

export async function listGuests(
  hotelId: string,
  query?: { search?: string },
) {
  const search = query?.search?.trim();
  const filter: Record<string, unknown> = { hotelId };

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const guests = await Guest.find(filter).sort({ createdAt: -1 });
  return toApiList(guests);
}

export async function getGuest(hotelId: string, id: string) {
  const guest = await Guest.findOne({ _id: id, hotelId });
  if (!guest) throw new AppError('Guest not found', 404);

  const [reservations, stays] = await Promise.all([
    Reservation.find({ guestId: id })
      .sort({ checkInDate: -1 })
      .limit(10)
      .populate('roomType')
      .populate('room'),
    Stay.find({ guestId: id })
      .sort({ checkedInAt: -1 })
      .limit(5)
      .populate('room'),
  ]);

  return {
    ...toApi(guest),
    reservations: toApiList(reservations),
    stays: toApiList(stays),
  };
}

export async function createGuest(
  hotelId: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    idDocument?: string;
    nationality?: string;
    notes?: string;
  },
) {
  if (!data.firstName?.trim() || !data.lastName?.trim()) {
    throw new AppError('First name and last name are required');
  }

  const guest = await Guest.create({
    hotelId,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    idDocument: data.idDocument?.trim() || null,
    nationality: data.nationality?.trim() || null,
    notes: data.notes?.trim() || null,
  });

  return toApi(guest);
}

export async function updateGuest(
  hotelId: string,
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idDocument: string;
    nationality: string;
    notes: string;
  }>,
) {
  const guest = await Guest.findOne({ _id: id, hotelId });
  if (!guest) throw new AppError('Guest not found', 404);

  if (data.firstName !== undefined) guest.firstName = data.firstName.trim();
  if (data.lastName !== undefined) guest.lastName = data.lastName.trim();
  if (data.email !== undefined) guest.email = data.email.trim() || null;
  if (data.phone !== undefined) guest.phone = data.phone.trim() || null;
  if (data.idDocument !== undefined) {
    guest.idDocument = data.idDocument.trim() || null;
  }
  if (data.nationality !== undefined) {
    guest.nationality = data.nationality.trim() || null;
  }
  if (data.notes !== undefined) guest.notes = data.notes.trim() || null;

  await guest.save();
  return toApi(guest);
}

export async function deleteGuest(hotelId: string, id: string) {
  const guest = await Guest.findOne({ _id: id, hotelId });
  if (!guest) throw new AppError('Guest not found', 404);

  const active = await Reservation.countDocuments({
    guestId: id,
    status: { $in: ['confirmed', 'checked_in'] },
  });
  if (active > 0) {
    throw new AppError('Cannot delete guest with active reservations');
  }

  await Guest.deleteOne({ _id: id });
  return { id };
}

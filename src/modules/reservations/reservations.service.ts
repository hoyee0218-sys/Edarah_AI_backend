import {
  Guest,
  Reservation,
  Room,
  RoomType,
} from '../../models/index.js';
import { idOf } from '../../models/plugins.js';
import { AppError } from '../../utils/errors.js';
import { toApi, toApiList } from '../../utils/serialize.js';

const RESERVATION_STATUSES = [
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show',
] as const;

type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

function parseDate(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new AppError('Invalid date');
  return d;
}

function parseReservationStatus(value: string): ReservationStatus {
  if ((RESERVATION_STATUSES as readonly string[]).includes(value)) {
    return value as ReservationStatus;
  }
  throw new AppError(
    `Invalid status. Allowed: ${RESERVATION_STATUSES.join(', ')}`,
  );
}

export async function checkAvailability(
  hotelId: string,
  params: {
    checkInDate: string;
    checkOutDate: string;
    roomTypeId?: string;
  },
) {
  const checkIn = parseDate(params.checkInDate);
  const checkOut = parseDate(params.checkOutDate);
  if (checkOut <= checkIn) {
    throw new AppError('Check-out must be after check-in');
  }

  const overlapping = await Reservation.find({
    hotelId,
    status: { $in: ['confirmed', 'checked_in'] },
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
    ...(params.roomTypeId ? { roomTypeId: params.roomTypeId } : {}),
  }).select('roomId roomTypeId');

  const occupiedRoomIds = overlapping
    .map((r) => (r.roomId ? idOf(r.roomId) : null))
    .filter(Boolean) as string[];

  const roomFilter: Record<string, unknown> = {
    hotelId,
    status: { $in: ['available', 'dirty', 'cleaning'] },
    ...(params.roomTypeId ? { roomTypeId: params.roomTypeId } : {}),
  };
  if (occupiedRoomIds.length > 0) {
    roomFilter._id = { $nin: occupiedRoomIds };
  }

  const rooms = await Room.find(roomFilter)
    .sort({ floor: 1, number: 1 })
    .populate('roomType');

  const roomTypes = await RoomType.find({
    hotelId,
    ...(params.roomTypeId ? { _id: params.roomTypeId } : {}),
  });

  const availability = roomTypes.map((type) => {
    const typeId = idOf(type._id);
    const availableRooms = rooms.filter(
      (r) => idOf(r.roomTypeId) === typeId,
    );
    return {
      roomType: toApi(type),
      availableCount: availableRooms.length,
      rooms: toApiList(availableRooms),
    };
  });

  return { checkIn, checkOut, availability };
}

export async function listReservations(
  hotelId: string,
  query?: { status?: string; date?: string },
) {
  const filter: Record<string, unknown> = { hotelId };
  if (query?.status) filter.status = query.status;

  if (query?.date) {
    const day = parseDate(query.date);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    filter.$or = [
      { checkInDate: { $gte: day, $lt: next } },
      { checkOutDate: { $gte: day, $lt: next } },
    ];
  }

  const reservations = await Reservation.find(filter)
    .sort({ checkInDate: 1 })
    .populate('guest')
    .populate('roomType')
    .populate({ path: 'room', populate: { path: 'roomType' } })
    .populate('stay');

  return toApiList(reservations);
}

export async function getReservation(hotelId: string, id: string) {
  const reservation = await Reservation.findOne({ _id: id, hotelId })
    .populate('guest')
    .populate('roomType')
    .populate({ path: 'room', populate: { path: 'roomType' } })
    .populate({
      path: 'stay',
      populate: [{ path: 'charges' }, { path: 'invoice' }],
    });

  if (!reservation) throw new AppError('Reservation not found', 404);
  return toApi(reservation);
}

export async function createReservation(
  hotelId: string,
  data: {
    guestId: string;
    roomTypeId: string;
    roomId?: string;
    checkInDate: string;
    checkOutDate: string;
    adults?: number;
    children?: number;
    notes?: string;
  },
) {
  const checkIn = parseDate(data.checkInDate);
  const checkOut = parseDate(data.checkOutDate);
  if (checkOut <= checkIn) {
    throw new AppError('Check-out must be after check-in');
  }

  const guest = await Guest.findOne({ _id: data.guestId, hotelId });
  if (!guest) throw new AppError('Guest not found', 404);

  const roomType = await RoomType.findOne({ _id: data.roomTypeId, hotelId });
  if (!roomType) throw new AppError('Room type not found', 404);

  if (data.roomId) {
    const room = await Room.findOne({
      _id: data.roomId,
      hotelId,
      roomTypeId: data.roomTypeId,
    });
    if (!room) throw new AppError('Room not found for this type', 404);
  }

  const availability = await checkAvailability(hotelId, {
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    roomTypeId: data.roomTypeId,
  });
  const typeAvail = availability.availability.find(
    (a) => idOf((a.roomType as { id?: string })?.id) === data.roomTypeId,
  );
  if (!typeAvail || typeAvail.availableCount < 1) {
    throw new AppError('No availability for selected dates');
  }

  const reservation = await Reservation.create({
    hotelId,
    guestId: data.guestId,
    roomTypeId: data.roomTypeId,
    roomId: data.roomId || null,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: data.adults ?? 1,
    children: data.children ?? 0,
    notes: data.notes?.trim() || null,
    status: 'confirmed',
  });

  await reservation.populate('guest');
  await reservation.populate('roomType');
  await reservation.populate('room');
  return toApi(reservation);
}

export async function updateReservation(
  hotelId: string,
  id: string,
  data: Partial<{
    roomTypeId: string;
    roomId: string | null;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    notes: string;
    status: string;
  }>,
) {
  const existing = await Reservation.findOne({ _id: id, hotelId });
  if (!existing) throw new AppError('Reservation not found', 404);

  if (existing.status === 'cancelled') {
    throw new AppError('Cannot edit a cancelled reservation');
  }

  if (existing.status === 'checked_out') {
    if (data.checkInDate !== undefined || data.checkOutDate !== undefined) {
      throw new AppError(
        'Cannot change check-in or check-out dates after check-out',
      );
    }
    throw new AppError('Cannot edit a completed reservation');
  }

  // Date rules by status
  if (data.checkInDate !== undefined || data.checkOutDate !== undefined) {
    if (existing.status === 'checked_in' && data.checkInDate !== undefined) {
      throw new AppError(
        'Cannot change check-in date after the guest has checked in',
      );
    }

    const nextCheckIn =
      data.checkInDate !== undefined
        ? parseDate(data.checkInDate)
        : existing.checkInDate;
    const nextCheckOut =
      data.checkOutDate !== undefined
        ? parseDate(data.checkOutDate)
        : existing.checkOutDate;

    if (nextCheckOut <= nextCheckIn) {
      throw new AppError('Check-out must be after check-in');
    }

    if (data.checkInDate !== undefined && existing.status === 'confirmed') {
      existing.checkInDate = nextCheckIn;
    }
    if (data.checkOutDate !== undefined) {
      // confirmed: both dates allowed; checked_in: checkout only
      existing.checkOutDate = nextCheckOut;
    }
  }

  // Non-date fields: only while confirmed (checked-in stays keep room assignment stable)
  if (existing.status === 'confirmed') {
    if (data.roomTypeId !== undefined) existing.roomTypeId = data.roomTypeId as never;
    if (data.roomId !== undefined) existing.roomId = data.roomId as never;
    if (data.adults !== undefined) existing.adults = data.adults;
    if (data.children !== undefined) existing.children = data.children;
  }

  if (data.notes !== undefined) existing.notes = data.notes.trim() || null;
  if (data.status !== undefined) {
    existing.status = parseReservationStatus(data.status);
  }

  await existing.save();
  await existing.populate('guest');
  await existing.populate('roomType');
  await existing.populate('room');
  return toApi(existing);
}

export async function cancelReservation(hotelId: string, id: string) {
  const existing = await Reservation.findOne({ _id: id, hotelId });
  if (!existing) throw new AppError('Reservation not found', 404);
  if (existing.status === 'checked_in') {
    throw new AppError('Cannot cancel a checked-in reservation. Check out first.');
  }
  if (existing.status === 'cancelled') {
    throw new AppError('Reservation already cancelled');
  }

  existing.status = 'cancelled';
  await existing.save();
  await existing.populate('guest');
  await existing.populate('roomType');
  await existing.populate('room');
  return toApi(existing);
}

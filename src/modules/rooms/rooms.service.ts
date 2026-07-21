import { Reservation, Room, RoomType, Stay } from '../../models/index.js';
import { AppError } from '../../utils/errors.js';
import { toApi, toApiList } from '../../utils/serialize.js';

const ROOM_STATUSES = [
  'available',
  'occupied',
  'dirty',
  'cleaning',
  'maintenance',
  'out_of_order',
] as const;

type RoomStatus = (typeof ROOM_STATUSES)[number];

function parseRoomStatus(status: string): RoomStatus {
  if ((ROOM_STATUSES as readonly string[]).includes(status)) {
    return status as RoomStatus;
  }
  throw new AppError(
    `Invalid status. Allowed: ${ROOM_STATUSES.join(', ')}`,
  );
}
export async function listRoomTypes(hotelId: string) {
  const types = await RoomType.find({ hotelId }).sort({ basePrice: 1 });
  const withCounts = await Promise.all(
    types.map(async (type) => {
      const rooms = await Room.countDocuments({ roomTypeId: type._id });
      return {
        ...toApi(type),
        _count: { rooms },
      };
    }),
  );
  return withCounts;
}

export async function createRoomType(
  hotelId: string,
  data: {
    name: string;
    description?: string;
    basePrice: number;
    capacity?: number;
    amenities?: string[];
  },
) {
  if (!data.name?.trim() || data.basePrice == null) {
    throw new AppError('Name and base price are required');
  }

  const roomType = await RoomType.create({
    hotelId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    basePrice: Number(data.basePrice),
    capacity: data.capacity ?? 2,
    amenities: data.amenities ? JSON.stringify(data.amenities) : null,
  });

  return toApi(roomType);
}

export async function listRooms(
  hotelId: string,
  query?: { status?: string; floor?: number },
) {
  const filter: Record<string, unknown> = { hotelId };
  if (query?.status) filter.status = query.status;
  if (query?.floor != null) filter.floor = query.floor;

  const rooms = await Room.find(filter)
    .sort({ floor: 1, number: 1 })
    .populate('roomType');

  return toApiList(rooms);
}

export async function getRoom(hotelId: string, id: string) {
  const room = await Room.findOne({ _id: id, hotelId }).populate('roomType');
  if (!room) throw new AppError('Room not found', 404);

  const stays = await Stay.find({ roomId: id, status: 'active' }).populate(
    'guest',
  );

  return {
    ...toApi(room),
    stays: toApiList(stays),
  };
}

export async function createRoom(
  hotelId: string,
  data: {
    number: string;
    roomTypeId: string;
    floor?: number;
    notes?: string;
  },
) {
  if (!data.number?.trim() || !data.roomTypeId) {
    throw new AppError('Room number and room type are required');
  }

  const roomType = await RoomType.findOne({ _id: data.roomTypeId, hotelId });
  if (!roomType) throw new AppError('Room type not found', 404);

  const existing = await Room.findOne({
    hotelId,
    number: data.number.trim(),
  });
  if (existing) throw new AppError('Room number already exists');

  const room = await Room.create({
    hotelId,
    number: data.number.trim(),
    roomTypeId: data.roomTypeId,
    floor: data.floor ?? 1,
    notes: data.notes?.trim() || null,
    status: 'available',
  });

  await room.populate('roomType');
  return toApi(room);
}

export async function updateRoomStatus(
  hotelId: string,
  id: string,
  status: string,
) {
  const nextStatus = parseRoomStatus(status);

  const room = await Room.findOne({ _id: id, hotelId });
  if (!room) throw new AppError('Room not found', 404);

  room.status = nextStatus;
  await room.save();
  await room.populate('roomType');
  return toApi(room);
}

export async function updateRoom(
  hotelId: string,
  id: string,
  data: Partial<{
    number: string;
    roomTypeId: string;
    floor: number;
    notes: string;
    status: string;
  }>,
) {
  if (data.status) {
    return updateRoomStatus(hotelId, id, data.status);
  }

  const room = await Room.findOne({ _id: id, hotelId });
  if (!room) throw new AppError('Room not found', 404);

  if (data.number !== undefined) room.number = data.number.trim();
  if (data.roomTypeId !== undefined) room.roomTypeId = data.roomTypeId as never;
  if (data.floor !== undefined) room.floor = data.floor;
  if (data.notes !== undefined) room.notes = data.notes.trim() || null;

  await room.save();
  await room.populate('roomType');
  return toApi(room);
}

export async function deleteRoom(hotelId: string, id: string) {
  const room = await Room.findOne({ _id: id, hotelId });
  if (!room) throw new AppError('Room not found', 404);

  if (room.status === 'occupied') {
    throw new AppError('Cannot delete an occupied room');
  }

  const activeStay = await Stay.countDocuments({
    roomId: id,
    status: 'active',
  });
  if (activeStay > 0) {
    throw new AppError('Cannot delete a room with an active stay');
  }

  const linkedReservations = await Reservation.countDocuments({
    roomId: id,
    status: { $in: ['confirmed', 'checked_in'] },
  });
  if (linkedReservations > 0) {
    throw new AppError('Cannot delete a room linked to active reservations');
  }

  await Room.deleteOne({ _id: id });
  return { id };
}

export async function deleteRoomType(hotelId: string, id: string) {
  const roomType = await RoomType.findOne({ _id: id, hotelId });
  if (!roomType) throw new AppError('Room type not found', 404);

  const roomCount = await Room.countDocuments({ roomTypeId: id });
  if (roomCount > 0) {
    throw new AppError(
      'Cannot delete a room type that still has rooms. Delete those rooms first.',
    );
  }

  const reservationCount = await Reservation.countDocuments({
    roomTypeId: id,
    status: { $in: ['confirmed', 'checked_in'] },
  });
  if (reservationCount > 0) {
    throw new AppError(
      'Cannot delete a room type linked to active reservations',
    );
  }

  await RoomType.deleteOne({ _id: id });
  return { id };
}

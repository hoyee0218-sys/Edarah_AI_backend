import {
  Invoice,
  Reservation,
  Room,
  Stay,
} from '../../models/index.js';
import { idOf } from '../../models/plugins.js';
import { toApiList } from '../../utils/serialize.js';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function getDashboard(hotelId: string) {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const departureReservationIds = await Reservation.find({
    hotelId,
    status: 'checked_in',
    checkOutDate: { $gte: todayStart, $lte: todayEnd },
  }).distinct('_id');

  const stayIds = await Stay.find({ hotelId }).distinct('_id');

  const [
    arrivals,
    departures,
    inHouse,
    rooms,
    occupiedRooms,
    todayRevenueAgg,
    recentInvoices,
  ] = await Promise.all([
    Reservation.find({
      hotelId,
      status: 'confirmed',
      checkInDate: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ checkInDate: 1 })
      .populate('guest')
      .populate('roomType')
      .populate('room'),
    Stay.find({
      hotelId,
      status: 'active',
      reservationId: { $in: departureReservationIds },
    })
      .populate('guest')
      .populate('room')
      .populate('reservation'),
    Stay.countDocuments({ hotelId, status: 'active' }),
    Room.countDocuments({ hotelId, status: { $ne: 'out_of_order' } }),
    Room.countDocuments({ hotelId, status: 'occupied' }),
    Invoice.aggregate([
      {
        $match: {
          stayId: { $in: stayIds },
          issuedAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Invoice.find({ stayId: { $in: stayIds } })
      .sort({ issuedAt: -1 })
      .limit(5)
      .populate({ path: 'stay', populate: { path: 'guest' } }),
  ]);

  const occupancyRate =
    rooms > 0 ? Number(((occupiedRooms / rooms) * 100).toFixed(1)) : 0;

  return {
    arrivals: toApiList(arrivals),
    departures: toApiList(departures),
    stats: {
      inHouse,
      totalRooms: rooms,
      occupiedRooms,
      occupancyRate,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
      arrivalsCount: arrivals.length,
      departuresCount: departures.length,
    },
    recentInvoices: toApiList(recentInvoices),
  };
}

export async function getOccupancyReport(hotelId: string) {
  const rooms = await Room.find({ hotelId }).populate('roomType');

  const byStatus = rooms.reduce<Record<string, number>>((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {});

  const byType = rooms.reduce<
    Record<string, { name: string; total: number; occupied: number }>
  >((acc, room) => {
    const typeId = idOf(room.roomTypeId);
    const roomType = room.roomType as unknown as { name?: string } | undefined;
    if (!acc[typeId]) {
      acc[typeId] = {
        name: roomType?.name || 'Unknown',
        total: 0,
        occupied: 0,
      };
    }
    acc[typeId]!.total += 1;
    if (room.status === 'occupied') acc[typeId]!.occupied += 1;
    return acc;
  }, {});

  return {
    byStatus,
    byType: Object.values(byType),
    rooms: toApiList(rooms),
  };
}

export async function getRevenueReport(hotelId: string) {
  const stayIds = await Stay.find({ hotelId }).distinct('_id');
  const invoices = await Invoice.find({ stayId: { $in: stayIds } })
    .sort({ issuedAt: -1 })
    .populate({
      path: 'stay',
      populate: [{ path: 'guest' }, { path: 'room' }],
    });

  const totals = invoices.reduce(
    (acc, inv) => {
      acc.roomTotal += inv.roomTotal;
      acc.chargesTotal += inv.chargesTotal;
      acc.taxAmount += inv.taxAmount;
      acc.grandTotal += inv.grandTotal;
      if (inv.status === 'paid') acc.paidTotal += inv.grandTotal;
      return acc;
    },
    {
      roomTotal: 0,
      chargesTotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      paidTotal: 0,
    },
  );

  return {
    invoices: toApiList(invoices),
    totals,
    count: invoices.length,
  };
}

import { Invoice, Stay } from '../../models/index.js';
import { idOf } from '../../models/plugins.js';
import { AppError } from '../../utils/errors.js';
import { toApi, toApiList } from '../../utils/serialize.js';

async function stayIdsForHotel(hotelId: string) {
  return Stay.find({ hotelId }).distinct('_id');
}

/** Invoices are immutable after creation — only list and read. */
export async function listInvoices(hotelId: string) {
  const stayIds = await stayIdsForHotel(hotelId);
  const invoices = await Invoice.find({ stayId: { $in: stayIds } })
    .sort({ issuedAt: -1 })
    .populate({
      path: 'stay',
      populate: [
        { path: 'guest' },
        { path: 'room', populate: { path: 'roomType' } },
        { path: 'reservation' },
      ],
    });

  return toApiList(invoices);
}

export async function getInvoice(hotelId: string, id: string) {
  const invoice = await Invoice.findById(id).populate({
    path: 'stay',
    populate: [
      { path: 'guest' },
      { path: 'room', populate: { path: 'roomType' } },
      { path: 'charges' },
      { path: 'reservation' },
    ],
  });

  if (!invoice) throw new AppError('Invoice not found', 404);

  const stay = invoice.stay as unknown as { hotelId?: unknown } | null;
  if (!stay || idOf(stay.hotelId) !== hotelId) {
    throw new AppError('Invoice not found', 404);
  }

  return toApi(invoice);
}

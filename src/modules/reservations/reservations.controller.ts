import type { Response } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';
import { paramId } from '../../utils/params.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as reservationsService from './reservations.service.js';

export const availability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { checkInDate, checkOutDate, roomTypeId } = req.query as {
    checkInDate?: string;
    checkOutDate?: string;
    roomTypeId?: string;
  };
  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({
      success: false,
      message: 'checkInDate and checkOutDate are required',
    });
  }
  const data = await reservationsService.checkAvailability(req.user!.hotelId, {
    checkInDate,
    checkOutDate,
    roomTypeId,
  });
  sendSuccess(res, data);
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reservationsService.listReservations(req.user!.hotelId, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    date: typeof req.query.date === 'string' ? req.query.date : undefined,
  });
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reservationsService.getReservation(
    req.user!.hotelId,
    paramId(req),
  );
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reservationsService.createReservation(
    req.user!.hotelId,
    req.body,
  );
  sendSuccess(res, data, 'Reservation created', 201);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reservationsService.updateReservation(
    req.user!.hotelId,
    paramId(req),
    req.body,
  );
  sendSuccess(res, data, 'Reservation updated');
});

export const cancel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reservationsService.cancelReservation(
    req.user!.hotelId,
    paramId(req),
  );
  sendSuccess(res, data, 'Reservation cancelled');
});

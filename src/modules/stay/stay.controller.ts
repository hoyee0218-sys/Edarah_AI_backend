import type { Response } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';
import { paramId } from '../../utils/params.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as stayService from './stay.service.js';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stayService.listStays(req.user!.hotelId, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
  });
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stayService.getStay(req.user!.hotelId, paramId(req));
  sendSuccess(res, data);
});

export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stayService.checkIn(req.user!.hotelId, req.body);
  sendSuccess(res, data, 'Guest checked in', 201);
});

export const updateNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { notes } = req.body as { notes?: string };
  const data = await stayService.updateStayNotes(
    req.user!.hotelId,
    paramId(req),
    notes || '',
  );
  sendSuccess(res, data, 'Stay notes updated');
});

export const addCharge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stayService.addCharge(
    req.user!.hotelId,
    paramId(req),
    req.body,
  );
  sendSuccess(res, data, 'Charge added', 201);
});

export const calculate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stayService.calculateBill(req.user!.hotelId, paramId(req));
  sendSuccess(res, data);
});

export const checkOut = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stayService.checkOut(req.user!.hotelId, paramId(req));
  sendSuccess(res, data, 'Guest checked out');
});

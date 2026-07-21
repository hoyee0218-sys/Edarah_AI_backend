import type { Response } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';
import { paramId } from '../../utils/params.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as guestsService from './guests.service.js';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await guestsService.listGuests(req.user!.hotelId, {
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
  });
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await guestsService.getGuest(req.user!.hotelId, paramId(req));
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await guestsService.createGuest(req.user!.hotelId, req.body);
  sendSuccess(res, data, 'Guest created', 201);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await guestsService.updateGuest(
    req.user!.hotelId,
    paramId(req),
    req.body,
  );
  sendSuccess(res, data, 'Guest updated');
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await guestsService.deleteGuest(req.user!.hotelId, paramId(req));
  sendSuccess(res, data, 'Guest deleted');
});

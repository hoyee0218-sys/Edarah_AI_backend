import type { Response } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';
import { paramId } from '../../utils/params.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as billingService from './billing.service.js';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await billingService.listInvoices(req.user!.hotelId);
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await billingService.getInvoice(req.user!.hotelId, paramId(req));
  sendSuccess(res, data);
});

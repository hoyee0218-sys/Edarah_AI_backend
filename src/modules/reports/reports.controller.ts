import type { Response } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as reportsService from './reports.service.js';

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reportsService.getDashboard(req.user!.hotelId);
  sendSuccess(res, data);
});

export const occupancy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reportsService.getOccupancyReport(req.user!.hotelId);
  sendSuccess(res, data);
});

export const revenue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reportsService.getRevenueReport(req.user!.hotelId);
  sendSuccess(res, data);
});

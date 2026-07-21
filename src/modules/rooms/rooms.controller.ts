import type { Response } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';
import { paramId } from '../../utils/params.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as roomsService from './rooms.service.js';

export const listTypes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await roomsService.listRoomTypes(req.user!.hotelId);
  sendSuccess(res, data);
});

export const createType = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await roomsService.createRoomType(req.user!.hotelId, req.body);
  sendSuccess(res, data, 'Room type created', 201);
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const floor =
    typeof req.query.floor === 'string' ? Number(req.query.floor) : undefined;
  const data = await roomsService.listRooms(req.user!.hotelId, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    floor: Number.isFinite(floor) ? floor : undefined,
  });
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await roomsService.getRoom(req.user!.hotelId, paramId(req));
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await roomsService.createRoom(req.user!.hotelId, req.body);
  sendSuccess(res, data, 'Room created', 201);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await roomsService.updateRoom(
    req.user!.hotelId,
    paramId(req),
    req.body,
  );
  sendSuccess(res, data, 'Room updated');
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status required' });
  }
  const data = await roomsService.updateRoomStatus(
    req.user!.hotelId,
    paramId(req),
    status,
  );
  sendSuccess(res, data, 'Room status updated');
});

export const removeType = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await roomsService.deleteRoomType(
    req.user!.hotelId,
    paramId(req),
  );
  sendSuccess(res, data, 'Room type deleted');
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await roomsService.deleteRoom(req.user!.hotelId, paramId(req));
  sendSuccess(res, data, 'Room deleted');
});

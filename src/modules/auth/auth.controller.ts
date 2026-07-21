import type { Response } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as authService from './auth.service.js';

export const login = asyncHandler(async (req, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  const data = await authService.login(email, password);
  sendSuccess(res, data, 'Logged in successfully');
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await authService.getMe(req.user!.userId);
  sendSuccess(res, data);
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current and new password required',
    });
  }
  const data = await authService.changePassword(
    req.user!.userId,
    currentPassword,
    newPassword,
  );
  sendSuccess(res, data, 'Password changed');
});

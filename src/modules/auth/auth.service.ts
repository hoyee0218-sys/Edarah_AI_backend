import { User } from '../../models/index.js';
import { AppError } from '../../utils/errors.js';
import {
  comparePassword,
  hashPassword,
  signToken,
} from '../../utils/helpers.js';
import { idOf } from '../../models/plugins.js';

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({
    userId: idOf(user._id),
    hotelId: idOf(user.hotelId),
    email: user.email,
    role: user.role,
  });

  const full = await getMe(idOf(user._id));

  return {
    token,
    user: full,
  };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId).populate(
    'hotelId',
    'name address phone',
  );
  if (!user) throw new AppError('User not found', 404);

  const hotel = user.hotelId as unknown as {
    _id?: unknown;
    id?: string;
    name: string;
    address?: string | null;
    phone?: string | null;
  };

  return {
    id: idOf(user._id),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    hotelId: idOf(hotel),
    hotel: {
      id: idOf(hotel),
      name: hotel.name,
      address: hotel.address ?? null,
      phone: hotel.phone ?? null,
    },
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return { message: 'Password updated' };
}

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  taxRate: Number(process.env.TAX_RATE) || 0.1,
  mongodbUri: process.env.MONGODB_URI || process.env.DATABASE_URL || '',
};

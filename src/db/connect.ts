import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from '../config/env.js';

export async function connectDatabase() {
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI (or DATABASE_URL) is not set in .env');
  }

  // mongodb+srv requires SRV DNS lookups. Local/VPN resolvers often return
  // querySrv ECONNREFUSED — use public DNS so Atlas SRV records resolve.
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.setDefaultResultOrder('ipv4first');

  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB');
}

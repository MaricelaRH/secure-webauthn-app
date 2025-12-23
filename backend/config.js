import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT,
  sessionSecret: process.env.SESSION_SECRET,
  dbUrl: process.env.DB_URL,
  rpID: process.env.RP_ID,
  origin: process.env.ORIGIN,
};
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { config } from './config.js';
import authRoutes from './routes/auth.routes.js';
import protectedRoutes from './routes/protected.routes.js';

export const app = express();

app.use(helmet());
app.use(express.json());

app.use(session({
  name: 'secure-session',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // true en producción con HTTPS
    sameSite: 'lax'
  }
}));

app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);

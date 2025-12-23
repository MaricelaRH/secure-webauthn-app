import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import protectedRoutes from './routes/protected.routes.js'; 
import { pool } from './db/index.js';
import cors from 'cors';

const app = express();

/* ================= CONFIG BASE ================= */

//Configuracion Cors
app.use(cors({
  origin: process.env.ORIGIN || 'https://localhost', // Solo permite propio origen
  credentials: true
}));

// Helmet añade headers de seguridad (CSP, HSTS, etc.) para mitigar XSS y Clickjacking
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://unpkg.com"],
      "style-src": ["'self'"],
      "connect-src": ["'self'"],
      "img-src": ["'self'"],
      "font-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      
      // Estas directivas NO heredan de default-src, hay que definirlas:
      "frame-ancestors": ["'none'"], // Evita Clickjacking total
      "form-action": ["'self'"],     // Solo permite enviar formularios a nuestro propio server
      
      "upgrade-insecure-requests": null
    },
  },

  // Las activamos aquí y las reforzamos en Nginx con 'always'
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xFrameOptions: { action: "deny" },
}));

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= SESIONES SEGURAS ================= */

const PgSessionStore = pgSession(session);

app.use(
  session({
    store: new PgSessionStore({
      pool,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,      
      httpOnly: true,    // Defensa contra robo de sesión vía XSS
      sameSite: 'strict', // Defensa contra CSRF
      maxAge: 1000 * 60 * 60 // 1 hora de duración
    },
  })
);

/* ================= FRONTEND ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Ruta explícita para el dashboard para evitar que Nginx o Express se confundan
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

/* ================= RUTAS API ================= */

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes); 

/* ================= SERVIDOR ================= */

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Servidor seguro escuchando en puerto ${process.env.PORT || 3000}`);
});
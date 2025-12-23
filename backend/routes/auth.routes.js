import express from 'express';
import {
  registerStart,
  registerFinish,
  loginStart,
  loginFinish,
  getProfile, 
  logout     
} from '../controllers/auth.controller.js';

const router = express.Router();

// Rutas de Registro
router.post('/register/start', registerStart);
router.post('/register/finish', registerFinish);

// Rutas de Login
router.post('/login/start', loginStart);
router.post('/login/finish', loginFinish);

// Rutas de Sesión y Perfil
router.get('/me', getProfile); // obtener el nombre en el dashboard
router.post('/logout', logout); // cerrar la sesión de forma segura

export default router;
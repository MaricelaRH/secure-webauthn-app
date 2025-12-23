import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Este endpoint simula datos sensibles que solo un usuario logueado puede ver
router.get('/dashboard-data', requireAuth, (req, res) => {
  res.json({ 
    message: 'Este es el reporte confidencial del sistema.',
    stats: {
      uptime: '99.9%',
      securityLevel: 'High (WebAuthn Active)'
    }
  });
});

export default router;
import { pool } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

import {
  registrationOptions,
  verifyRegistration,
  authenticationOptions,
  verifyAuthentication
} from '../services/webauthn.service.js';

/* =====================================================
   REGISTRO
===================================================== */
export async function registerStart(req, res) {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username requerido' });

    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rowCount > 0) return res.status(409).json({ error: 'Usuario ya registrado' });

    const tempUserId = uuidv4();
    const userIdBuffer = Buffer.from(tempUserId.replace(/-/g, ''), 'hex');

    const options = await registrationOptions({ id: userIdBuffer, username });

    req.session.challenge = options.challenge;
    req.session.tempUserId = tempUserId;
    req.session.username = username;

    console.log(`Registro iniciado: ${username}`);
    return res.json(options);
  } catch (error) {
    console.error('Error en registerStart:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function registerFinish(req, res) {
  try {
    const { challenge, tempUserId, username } = req.session;
    if (!challenge || !tempUserId) return res.status(400).json({ error: 'Sesión inválida' });

    const verification = await verifyRegistration({ response: req.body, expectedChallenge: challenge });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Registro no verificado' });
    }

    const regInfo = verification.registrationInfo;
    const cred = regInfo.credential || regInfo;
    
    // Mapeo flexible de llaves para el guardado
    const credentialID = cred.id || regInfo.credentialID || regInfo.credentialId;
    const rawPublicKey = cred.publicKey || regInfo.credentialPublicKey;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO users (id, username) VALUES ($1, $2)', [tempUserId, username]);
      
      // Guardar como strings Base64URL
      const credIdStr = typeof credentialID === 'string' ? credentialID : Buffer.from(credentialID).toString('base64url');
      const pubKeyStr = Buffer.from(Object.values(rawPublicKey)).toString('base64url');

      await client.query(
        `INSERT INTO webauthn_credentials 
         (user_id, credential_id, public_key, counter, transports) 
         VALUES ($1, $2, $3, $4, $5)`,
        [tempUserId, credIdStr, pubKeyStr, regInfo.counter || 0, JSON.stringify(req.body.response?.transports || [])]
      );
      await client.query('COMMIT');
      req.session.challenge = null;
      console.log(`Registro completado: ${username}`);
      return res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally { client.release(); }
  } catch (error) {
    console.error('Error en registerFinish:', error);
    return res.status(500).json({ error: 'Error al finalizar registro' });
  }
}

/* =====================================================
  LOGIN
===================================================== */
export async function loginStart(req, res) {
  try {
    const { username } = req.body;
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = userRes.rows[0];
    const credsRes = await pool.query('SELECT * FROM webauthn_credentials WHERE user_id = $1', [user.id]);
    if (!credsRes.rows.length) return res.status(400).json({ error: 'No hay dispositivos' });

    const options = await authenticationOptions(credsRes.rows);
    req.session.challenge = options.challenge;
    req.session.userId = user.id;

    console.log(`Login iniciado: ${username}`);
    return res.json(options);
  } catch (error) {
    console.error('Error en loginStart:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function loginFinish(req, res) {
  try {
    const { challenge, userId } = req.session;
    if (!challenge || !userId) return res.status(400).json({ error: 'Sesión expirada' });

    const credentialID = req.body.id;
    const credRes = await pool.query(
      `SELECT c.*, u.username FROM webauthn_credentials c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.credential_id = $1`, [credentialID]);

    if (credRes.rowCount === 0) return res.status(400).json({ error: 'Dispositivo desconocido' });

    const credential = credRes.rows[0];
    const verification = await verifyAuthentication({ response: req.body, expectedChallenge: challenge, credential });

    if (verification.verified) {
      await pool.query('UPDATE webauthn_credentials SET counter = $1 WHERE credential_id = $2',
        [verification.authenticationInfo.newCounter, credentialID]);

      // ---  Guardado explícito ---
      req.session.authenticated = true;
      req.session.userId = userId;
      req.session.username = credential.username; 

      // Forzamos el guardado en la DB antes de responder
      req.session.save((err) => {
        if (err) {
          console.error("Error al guardar sesión:", err);
          return res.status(500).json({ error: 'Error interno de sesión' });
        }
        console.log(`Acceso concedido y sesión guardada: ${credential.username}`);
        return res.json({ success: true });
      });
    } else {
      return res.status(401).json({ error: 'Firma inválida' });
    }
  } catch (error) {
    console.error('Error en loginFinish:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

// Devuelve el usuario de la sesión actual
export async function getProfile(req, res) {
  if (req.session.authenticated && req.session.username) {
    return res.json({ username: req.session.username });
  }
  return res.status(401).json({ error: 'No autorizado' });
}

// Cierra la sesión
export async function logout(req, res) {
  req.session.destroy();
  res.clearCookie('connect.sid');
  return res.json({ success: true });
}
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

const rpName = 'Secure WebAuthn App';
const rpID = 'localhost';
const origin = 'https://localhost';

export async function registrationOptions(user) {
  return await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.username,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },
      { alg: -257, type: 'public-key' }
    ],
  });
}

export async function verifyRegistration({ response, expectedChallenge }) {
  return await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
}

export async function authenticationOptions(credentials) {
  return await generateAuthenticationOptions({
    timeout: 60000,
    rpID,
    allowCredentials: credentials.map(cred => ({
      id: cred.credential_id, 
      type: 'public-key',
      transports: Array.isArray(cred.transports) ? cred.transports : JSON.parse(cred.transports || '[]'),
    })),
    userVerification: 'preferred',
  });
}

export async function verifyAuthentication({ response, expectedChallenge, credential }) {
  console.log("Iniciando validación para:", credential.username);

  let transportsArray = [];
  try {
    transportsArray = Array.isArray(credential.transports) 
      ? credential.transports 
      : JSON.parse(credential.transports || '[]');
  } catch (e) { transportsArray = []; }

  
  return await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: { 
      id: credential.credential_id,
      publicKey: new Uint8Array(Buffer.from(credential.public_key, 'base64url')),
      counter: parseInt(credential.counter || 0, 10),
      transports: transportsArray,
    },
    requireUserVerification: true
  });
}